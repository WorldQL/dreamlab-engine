import {
  Camera,
  Empty,
  EntityDefinition,
  GameStatus,
  ServerGame,
  EditorFakeCamera,
  Entity,
} from "@dreamlab/engine";
import { WorkerInitData } from "../server-common/worker-data.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";
import { IPCMessageBus } from "./ipc.ts";

import {
  ProjectSchema,
  Scene,
  convertEntityDefinition,
  loadSceneDefinition,
  serializeEntityDefinition,
} from "@dreamlab/scene";

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

const { default: preLoadBehaviors } = await import(
  game.resolveResource("res://_dreamlab_behavior_preload.js")
);
await preLoadBehaviors(game);

const projectDesc = await game
  .fetch("res://project.json")
  .then(r => r.text())
  .then(JSON.parse)
  .then(ProjectSchema.parse);

// TODO: for multi-scene should we take some param from WorkerInitData here?
const scene = projectDesc.scenes.main;

if (workerData.editMode) {
  if (scene.registration) {
    await Promise.all(scene.registration.map(script => import(game.resolveResource(script))));
  }

  // we have to do this since Camera doesn't like being spawned anywhere except game.local
  const useEditorFacades = (def: EntityDefinition) => {
    if (def.type === Camera) def.type = EditorFakeCamera;
    def.children?.forEach(c => useEditorFacades(c));
    return def;
  };

  const dropEditorFacades = (def: EntityDefinition) => {
    if (def.type === EditorFakeCamera) def.type = Camera;
    def.children?.forEach(c => dropEditorFacades(c));
    return def;
  };

  const editEntities = game.world.spawn({
    type: Empty,
    name: "EditEntities",
    _ref: "EDIT_ROOT",
  });
  const editWorld = editEntities.spawn({
    type: Empty,
    name: "world",
    _ref: "EDIT_WORLD",
  });
  const editPrefabs = editEntities.spawn({
    type: Empty,
    name: "prefabs",
    _ref: "EDIT_PREFABS",
  });
  const editLocal = editEntities.spawn({
    type: Empty,
    name: "local",
    _ref: "EDIT_LOCAL",
  });
  const editServer = editEntities.spawn({
    type: Empty,
    name: "server",
    _ref: "EDIT_SERVER",
  });

  ipc.addMessageListener("SceneDefinitionRequest", () => {
    const serializeForScene = (entity: Entity) =>
      serializeEntityDefinition(game, dropEditorFacades(entity.getDefinition()));

    const scene: Scene = {
      world: [...editWorld.children.values()].map(serializeForScene),
      local: [...editLocal.children.values()].map(serializeForScene),
      server: [...editServer.children.values()].map(serializeForScene),
      prefabs: [...editPrefabs.children.values()].map(serializeForScene),
    };

    ipc.send({ op: "SceneDefinitionResponse", sceneJson: scene });
  });

  for (const [sceneRoot, editRoot] of [
    [scene.world, editWorld],
    [scene.local, editLocal],
    [scene.server, editServer],
    [scene.prefabs, editPrefabs],
  ] as const) {
    const defs = await Promise.all(sceneRoot.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) {
      editRoot.spawn(useEditorFacades(def));
    }
  }
} else {
  await loadSceneDefinition(game, scene);
}

game.setStatus(GameStatus.Running);
