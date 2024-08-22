import { Empty, GameStatus, ServerGame, Entity, EntityDefinition } from "@dreamlab/engine";
import { WorkerInitData } from "../server-common/worker-data.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";
import { IPCMessageBus } from "./ipc.ts";

import {
  Facades,
  WorldRootFacade,
  PrefabRootFacade,
  LocalRootFacade,
  ServerRootFacade,
  EditorMetadataEntity,
} from "../../editor/common/mod.ts";

import {
  BehaviorSchema as SceneDescBehaviorSchema,
  ProjectSchema,
  Scene,
  SceneDescBehavior,
  SceneDescEntity,
  convertEntityDefinition,
  loadSceneDefinition,
  serializeEntityDefinition,
} from "@dreamlab/scene";
import { z } from "@dreamlab/vendor/zod.ts";

const workerData = JSON.parse(Deno.env.get("DREAMLAB_MP_WORKER_DATA")!) as WorkerInitData;
Deno.env.delete("DREAMLAB_MP_WORKER_DATA");

const ipc = new IPCMessageBus(workerData);
await ipc.connected();

// TODO: hook the console to do proper logging

const net = new ServerNetworkManager(ipc);
const game = new ServerGame({
  instanceId: workerData.instanceId,
  worldId: workerData.worldId,
  network: net.createNetworking(),
});
game.worldScriptBaseURL = `file://${workerData.worldDirectory}/`;
Object.defineProperties(globalThis, { net: { value: net }, game: { value: game } });
net.setup(game);
await game.initialize();

const behaviors = await game
  .fetch("res://_dreamlab_behaviors.json")
  .then(r => r.json())
  .then(z.record(z.string()).parse);
await Promise.all(Object.values(behaviors).map(s => game.loadBehavior(s)));

const projectDesc = await game
  .fetch("res://project.json")
  .then(r => r.json())
  .then(ProjectSchema.parse);

// TODO: for multi-scene should we take some param from WorkerInitData here?
const scene = projectDesc.scenes.main;

if (workerData.editMode) {
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
        def.behaviors = behaviors;
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

    const scene: Scene = {
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

    ipc.send({ op: "SceneDefinitionResponse", sceneJson: scene });
  });

  for (const [sceneRoot, editRoot] of [
    [scene.world, editWorld],
    [scene.local, editLocal],
    [scene.server, editServer],
    [scene.prefabs, editPrefabs],
  ] as const) {
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
} else {
  await loadSceneDefinition(game, scene);
}

game.setStatus(GameStatus.Running);

const tickDelta = 1_000 / game.time.TPS;

let tickAcc = 0.0;
let time = performance.now();
setInterval(() => {
  const now = performance.now();
  const delta = now - time;
  time = now;

  tickAcc += delta;
  if (tickAcc > 5000) {
    console.warn("Skipping ticks (accumulator ran over 5 seconds)");
    tickAcc = 0.0;
  }

  while (tickAcc > tickDelta) {
    tickAcc -= tickDelta;
    game.tick();
  }
}, tickDelta / 2);
