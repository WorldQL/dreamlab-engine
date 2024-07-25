import { GameStatus, ServerGame } from "@dreamlab/engine";
import { WorkerInitData } from "../common/worker-data.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";
import { IPCMessageBus } from "./ipc.ts";

const workerData = JSON.parse(Deno.env.get("DREAMLAB_MP_WORKER_DATA")!) as WorkerInitData;
Deno.env.delete("DREAMLAB_MP_WORKER_DATA");

// TODO: connect to IPC bus
const ipc = new IPCMessageBus(workerData);
await ipc.connected();

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

// FIXME: we are not building temp-server-main atm, so skip this
// const { default: serverMain } = await import(game.resolveResource("res://temp-server-main.js"));
// await serverMain(game);

game.setStatus(GameStatus.Running);
console.log("eyyyy i'm runnin a game ova here");

// TODO: run the tick loop properly (run at 2x rate + do delta accumulation)
setInterval(() => {
  game.tick();
}, 1_000 / game.time.TPS);
