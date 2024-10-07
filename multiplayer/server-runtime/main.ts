import { GameStatus, ServerGame } from "@dreamlab/engine";
import { WorkerInitData } from "../server-common/worker-data.ts";
import { IPCMessageBus } from "./ipc.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";

import { ProjectSchema, getSceneDescFromProject, loadSceneDefinition } from "@dreamlab/scene";
import { z } from "@dreamlab/vendor/zod.ts";
import { ServerScene } from "../../engine/scene.ts";
import { handleEditMode } from "./edit-mode.ts";

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
const preloadResults = await Promise.allSettled(
  Object.values(behaviors).map(s => game.loadBehavior(s)),
);
for (const result of preloadResults) {
  if (result.status === "rejected") {
    console.warn(result.reason);
  }
}

const projectDesc = await game
  .fetch("res://project.json")
  .then(r => r.json())
  .then(ProjectSchema.parse);

const mainSceneDesc = await getSceneDescFromProject(game, projectDesc, "main");
const mainScene = new ServerScene(game);
game.scenes["main"] = mainScene;
game.currentScene = mainScene;

if (workerData.editMode) {
  await handleEditMode(ipc, game, mainScene, mainSceneDesc);
} else {
  await loadSceneDefinition(game, mainScene, mainSceneDesc);
}

game.setStatus(GameStatus.LoadingFinished);
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
