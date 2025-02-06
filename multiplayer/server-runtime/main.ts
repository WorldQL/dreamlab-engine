import "npm:source-map-support@0.5.21/register.js"; // evanw clutch

import { GameStatus, KvServer, ServerGame, Time } from "@dreamlab/engine";
import { WorkerInitData } from "../server-common/worker-data.ts";
import type { WorkerMetrics } from "../server-host/metrics.ts";
import { IPCMessageBus } from "./ipc.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";

import { ProjectSchema, getSceneFromProject, loadSceneDefinition } from "@dreamlab/scene";
import { z } from "@dreamlab/vendor/zod.ts";
import { handleEditMode } from "./edit-mode.ts";

const workerData = JSON.parse(Deno.env.get("DREAMLAB_MP_WORKER_DATA")!) as WorkerInitData;
Deno.env.delete("DREAMLAB_MP_WORKER_DATA");

const ipc = new IPCMessageBus(workerData);
await ipc.connected();

// TODO: hook the console to do proper logging

ipc.addMessageListener("MetricsRequest", ({ id }) => {
  // TODO: report real values
  const metrics: WorkerMetrics = { cpu: 1, memory: 2 };

  ipc.send({ op: "MetricsResponse", id, metrics });
});

const net = new ServerNetworkManager(ipc);
const game = new ServerGame({
  instanceId: workerData.instanceId,
  worldId: workerData.worldId,
  network: net.createNetworking(),
  kv: game =>
    new KvServer({
      game,
      url: workerData.kvUrl,
      signingKey: workerData.kvSigningKey,
      clientUrl: workerData.kvClientUrl,
    }),
});
game.worldScriptBaseURL = `file://${workerData.worldDirectory}/`;
Object.defineProperties(globalThis, { net: { value: net }, game: { value: game } });
net.setup(game);

game.paused.onChanged(paused => {
  ipc.send({ op: "PauseChanged", paused });
});

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

const mainScene = await getSceneFromProject(game, projectDesc, "main");

if (workerData.editMode) {
  await handleEditMode(ipc, game, mainScene);
} else {
  await loadSceneDefinition(game, mainScene);
}

game.setStatus(GameStatus.LoadingFinished);
game.setStatus(GameStatus.Running);

ipc.send({ op: "GameLoaded" });

const tickDelta = 1_000 / game.time.TPS;

let tickAcc = 0.0;
let time = performance.now();
setInterval(() => {
  const now = performance.now();
  const delta = now - time;
  time = now;

  tickAcc += delta * Time.TIME_SCALE;
  if (tickAcc > 5000) {
    console.warn("Skipping ticks (accumulator ran over 5 seconds)");
    tickAcc = 0.0;
  }

  while (tickAcc > tickDelta) {
    tickAcc -= tickDelta;
    game.tick();
  }
}, tickDelta / 2);
