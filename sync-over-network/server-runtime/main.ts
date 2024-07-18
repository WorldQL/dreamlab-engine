import { ServerGame } from "@dreamlab/engine";
import { WorkerInitData } from "../server-common/worker-data.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";
import { IPCMessageBus } from "./ipc.ts";

const workerData = JSON.parse(Deno.env.get("DREAMLAB_MP_WORKER_DATA")!) as WorkerInitData;
Deno.env.delete("DREAMLAB_MP_WORKER_DATA");

// TODO: connect to IPC bus
const ipc = new IPCMessageBus(workerData);
await ipc.connected();
console.log("Connected via IPC!!");

const network = new ServerNetworkManager(ipc);
const game = new ServerGame({
  instanceId: workerData.instanceId,
  worldId: workerData.worldId,
  network: network.createNetworking(),
});
network.setup(game);
await game.initialize();

// TODO: load test world
