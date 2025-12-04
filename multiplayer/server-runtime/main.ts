import "npm:source-map-support@0.5.21/register.js"; // evanw clutch

// DO NOT REMOVE
// early import the ui code so we can access it in a dynamic import context without permission checks
// deno is cool but stupid sometimes lmaooo
import "@dreamlab/ui";
import "@dreamlab/ui/jsx-runtime";

import { GameStatus, KvServer, ServerGame, Time } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { WorkerInitData } from "../server-common/worker-data.ts";
import { IPCMessageBus } from "./ipc.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";
import { rewriteStackTraces } from "./stack.ts";

import { ProjectSchema, getSceneFromProject, loadSceneDefinition } from "@dreamlab/scene";
import * as z from "@dreamlab/vendor/zod.ts";
import { handleEditMode } from "./edit-mode.ts";
import { handleHttpAPI } from "./http-api.ts";
import { KvServerStub } from "./kv-server-stub.ts";

addEventListener("unhandledrejection", event => {
  event.preventDefault();
  if (event.reason) console.error("caught potential fatal error:", event.reason);
});

addEventListener("error", event => {
  event.preventDefault();
  if (event.error) console.error("caught potential fatal error:", event.error);
});

const workerData = JSON.parse(Deno.env.get("DREAMLAB_MP_WORKER_DATA")!) as WorkerInitData;
Deno.env.delete("DREAMLAB_MP_WORKER_DATA");

rewriteStackTraces(workerData);

const ipc = new IPCMessageBus(workerData);
await ipc.connected();

// TODO: hook the console to do proper logging

const earlyProjectJson = await Deno.readTextFile(
  workerData.worldDirectory + "/project.json",
).then(txt => JSON.parse(txt) as unknown);
const earlyProjectSchema = ProjectSchema.safeParse(earlyProjectJson);

const ticksPerSecond = workerData.editMode
  ? undefined
  : earlyProjectSchema.success
    ? earlyProjectSchema.data.tick_rate
    : undefined;

const net = new ServerNetworkManager(ipc);
const game = new ServerGame({
  instanceId: workerData.instanceId,
  worldId: workerData.worldId,
  network: net.createNetworking(),
  ticksPerSecond,
  kv: game =>
    workerData.kv
      ? new KvServer({
          game,
          url: workerData.kv.url,
          signingKey: workerData.kv.signingKey,
          clientUrl: workerData.kv.clientUrl,
        })
      : new KvServerStub({ game }),
});
game.worldScriptBaseURL = `file://${workerData.worldDirectory}/`;
Object.defineProperties(globalThis, { net: { value: net }, game: { value: game } });
net.setup(game);

game.paused.onChanged(paused => {
  ipc.send({ op: "PauseChanged", paused });
});

ipc.addMessageListener("ReloadBehaviors", async message => {
  await Promise.all(message.scripts.map(s => game[internal.behaviorLoader].reload(s)));
});

await game.initialize();

await handleHttpAPI(ipc, game);

const BehaviorSchema = z.record(
  z.string(),
  z.object({ uri: z.string(), name: z.string().optional(), hash: z.string().optional() }),
);

const behaviorPreloadInfo = await game
  .fetch("res://_dreamlab_behaviors.json")
  .then(r => r.json())
  .then(BehaviorSchema.parse);
game[internal.behaviorLoader].submitPreloadInfo([...Object.values(behaviorPreloadInfo)]);
/* const preloadResults = await Promise.allSettled(
  Object.values(behaviors).map(b => game.loadBehavior(b.uri)),
);
for (const result of preloadResults) {
  if (result.status === "rejected") {
    console.warn(result.reason);
  }
} */

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

let lastHeartbeat = performance.now();

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

  if (now - lastHeartbeat > 1_000) {
    lastHeartbeat = now;
    ipc.send({ op: "WorkerHeartbeat" });
  }
}, tickDelta / 2);
