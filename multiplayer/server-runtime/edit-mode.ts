import {
  Scene,
  SceneDescEntity,
  BehaviorSchema as SceneDescBehaviorSchema,
  SceneDescBehavior,
  serializeEntityDefinition,
  convertEntityDefinition,
  SceneSchema,
  ProjectSchema,
} from "@dreamlab/scene";
import { Empty, Entity, EntityDefinition, ServerGame } from "@dreamlab/engine";
import {
  EditorMetadataEntity,
  Facades,
  LocalRootFacade,
  PrefabRootFacade,
  ServerRootFacade,
  WorldRootFacade,
} from "../../editor/common/mod.ts";
import { IPCMessageBus } from "./ipc.ts";
import { z } from "@dreamlab/vendor/zod.ts";

const addEditorMetadata = (
  sceneDef: SceneDescEntity,
  entityDef: EntityDefinition,
): EntityDefinition => {
  if (!entityDef.children) entityDef.children = [];

  const behaviors = entityDef.behaviors;
  let behaviorsJson: string | undefined;
  if (behaviors) {
    entityDef.behaviors = [];
    behaviorsJson = sceneDef.behaviors && JSON.stringify(sceneDef.behaviors);
  }

  entityDef.children!.push({
    type: EditorMetadataEntity,
    name: "__EditorMetadata",
    values: {
      behaviorsJson,
    },
  });

  sceneDef.children?.forEach(sceneChild => {
    const entityChild = entityDef.children?.find(e => sceneChild.ref === e._ref);
    if (!entityChild) return;
    addEditorMetadata(sceneChild, entityChild);
  });

  return entityDef;
};

const dropEditorMetadata = (def: EntityDefinition): EntityDefinition => {
  if (def.children) def.children = def.children.filter(d => d.type !== EditorMetadataEntity);
  def.children?.forEach(c => dropEditorMetadata(c));
  return def;
};

const reinjectBehaviors = (entity: Entity, def: SceneDescEntity): SceneDescEntity => {
  try {
    const metadata = entity.children.get("__EditorMetadata")?.cast(EditorMetadataEntity);
    if (metadata) {
      const behaviors = SceneDescBehaviorSchema.array().parse(
        JSON.parse(metadata.behaviorsJson),
      ) as SceneDescBehavior[];

      // TODO: elide any default values

      def.behaviors = behaviors.length === 0 ? undefined : behaviors;
    }
  } catch (err) {
    console.warn(err);
  }

  def.children?.forEach(c => {
    const childEntity = entity.children.get(c.name);
    if (!childEntity) return;
    reinjectBehaviors(childEntity, c);
  });

  return def;
};

export const handleEditMode = async (
  ipc: IPCMessageBus,
  game: ServerGame,
  scene: z.output<typeof SceneSchema>,
) => {
  if (scene.registration) {
    await Promise.all(scene.registration.map(script => import(game.resolveResource(script))));
  }

  const editEntities = game.world.spawn({
    type: Empty,
    name: "EditEntities",
    _ref: "EDIT_ROOT",
  });
  const editWorld = editEntities.spawn({
    type: WorldRootFacade,
    name: "world",
    _ref: "EDIT_WORLD",
  });
  const editPrefabs = editEntities.spawn({
    type: PrefabRootFacade,
    name: "prefabs",
    _ref: "EDIT_PREFABS",
  });
  const editLocal = editEntities.spawn({
    type: LocalRootFacade,
    name: "local",
    _ref: "EDIT_LOCAL",
  });
  const editServer = editEntities.spawn({
    type: ServerRootFacade,
    name: "server",
    _ref: "EDIT_SERVER",
  });

  ipc.addMessageListener("SceneDefinitionRequest", () => {
    const serializeForScene = (entity: Entity) =>
      reinjectBehaviors(
        entity,
        serializeEntityDefinition(
          game,
          dropEditorMetadata(Facades.dropEditorFacades(entity.getDefinition())),
        ),
      );

    const newScene: Scene = {
      registration: scene.registration,
      world: [...editWorld.children.values()]
        .filter(e => !(e instanceof EditorMetadataEntity))
        .map(serializeForScene),
      local: [...editLocal.children.values()]
        .filter(e => !(e instanceof EditorMetadataEntity))
        .map(serializeForScene),
      server: [...editServer.children.values()]
        .filter(e => !(e instanceof EditorMetadataEntity))
        .map(serializeForScene),
      prefabs: [...editPrefabs.children.values()]
        .filter(e => !(e instanceof EditorMetadataEntity))
        .map(serializeForScene),
    };

    ipc.send({ op: "SceneDefinitionResponse", sceneJson: newScene });
  });

  const sceneRoots: [SceneDescEntity[], Entity][] = [
    [scene.world, editWorld],
    [scene.local, editLocal],
    [scene.server, editServer],
    [scene.prefabs, editPrefabs],
  ];

  const loadFromScene = async (
    customSceneRoots?: ReadonlyArray<[SceneDescEntity[], Entity]>,
  ) => {
    const rootsToUse = customSceneRoots || sceneRoots;

    for (const [sceneRoot, editRoot] of rootsToUse) {
      const defs = await Promise.all(
        sceneRoot.map(sceneDef =>
          convertEntityDefinition(game, sceneDef).then(
            entityDef => [sceneDef, entityDef] as const,
          ),
        ),
      );

      for (const [sceneDef, entityDef] of defs) {
        editRoot.spawn(addEditorMetadata(sceneDef, Facades.useEditorFacades(entityDef)));
      }
    }
  };
  await loadFromScene();

  ipc.addMessageListener("ReloadEditScene", async () => {
    const projectDesc = await game
      .fetch("res://project.json")
      .then(r => r.json())
      .then(ProjectSchema.parse);

    for (const [_sceneRoot, editRoot] of sceneRoots) {
      for (const entity of editRoot.children.values()) {
        entity.destroy();
      }
    }

    const newScene = projectDesc.scenes.main;
    scene.world = newScene.world;
    scene.local = newScene.local;
    scene.server = newScene.server;
    scene.prefabs = newScene.prefabs;

    const updatedSceneRoots: [SceneDescEntity[], Entity][] = [
      [scene.world, editWorld],
      [scene.local, editLocal],
      [scene.server, editServer],
      [scene.prefabs, editPrefabs],
    ];

    await loadFromScene(updatedSceneRoots);
  });
};
