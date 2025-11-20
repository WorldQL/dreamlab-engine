import { Empty, Entity, EntityDefinition, ServerGame } from "@dreamlab/engine";
import {
  convertEntityDefinition,
  getSceneFromProject,
  ProjectSchema,
  Scene,
  SceneDescBehavior,
  BehaviorSchema as SceneDescBehaviorSchema,
  SceneDescEntity,
  SceneSchema,
  serializeEntityDefinition,
} from "@dreamlab/scene";
import * as z from "@dreamlab/vendor/zod.ts";
import {
  EditorMetadataEntity,
  editorRenameBehavior,
  Facades,
  LocalRootFacade,
  PrefabRootFacade,
  ServerRootFacade,
  WorldRootFacade,
} from "../../editor/common/mod.ts";
import { IPCMessageBus } from "./ipc.ts";

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
      locked: sceneDef.locked,
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

const applyEditorMetadata = (entity: Entity, def: SceneDescEntity): SceneDescEntity => {
  try {
    const metadata = entity.children.get("__EditorMetadata")?.cast(EditorMetadataEntity);
    if (metadata) {
      const behaviors = SceneDescBehaviorSchema.array().parse(
        JSON.parse(metadata.behaviorsJson),
      ) as SceneDescBehavior[];

      // TODO: elide any default values
      behaviors.map(b => {
        if (b.values && Object.keys(b.values).length === 0) delete b.values;
        if (b.overrides && Object.keys(b.overrides).length === 0) delete b.overrides;
        if (b.sync && Object.keys(b.sync).length === 0) delete b.sync;
      });

      def.behaviors = behaviors.length === 0 ? undefined : behaviors;
      def.locked = metadata.locked || undefined;
    }
  } catch (err) {
    console.warn(err);
  }

  def.children?.forEach(c => {
    const childEntity = entity.children.get(c.name);
    if (!childEntity) return;
    applyEditorMetadata(childEntity, c);
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
  const editPrefabs = editEntities.spawn({
    type: PrefabRootFacade,
    name: "prefabs",
    _ref: "EDIT_PREFABS",
  });
  const editWorld = editEntities.spawn({
    type: WorldRootFacade,
    name: "world",
    _ref: "EDIT_WORLD",
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
      applyEditorMetadata(
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

  let sceneRoots: [SceneDescEntity[], Entity][] = [
    [scene.prefabs, editPrefabs],
    [scene.world, editWorld],
    [scene.local, editLocal],
    [scene.server, editServer],
  ];

  const loadFromScene = async () => {
    for (const [sceneRoot, editRoot] of sceneRoots) {
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

  ipc.addMessageListener("ImportEditPrefab", async message => {
    const def = await convertEntityDefinition(game, message.entity);
    editPrefabs.spawn(addEditorMetadata(message.entity, Facades.useEditorFacades(def)));
  });

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

    await game.time.waitForTicks(2);

    const newScene = await getSceneFromProject(game, projectDesc, "main");
    scene.prefabs = newScene.prefabs;
    scene.world = newScene.world;
    scene.local = newScene.local;
    scene.server = newScene.server;

    sceneRoots = [
      [scene.prefabs, editPrefabs],
      [scene.world, editWorld],
      [scene.local, editLocal],
      [scene.server, editServer],
    ];

    await loadFromScene();
  });

  game.network.onReceiveCustomMessage((_from, channel, data) => {
    if (channel !== "@editor/rename-behavior") return;
    const packet = z.object({ oldUri: z.string(), newUri: z.string() }).parse(data);
    editorRenameBehavior(game, packet.oldUri, packet.newUri);
  });
};
