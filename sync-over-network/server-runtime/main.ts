import { GameStatus, ServerGame } from "@dreamlab/engine";
import { WorkerInitData } from "../server-common/worker-data.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";
import { IPCMessageBus } from "./ipc.ts";

import { ProjectSchema, loadSceneDefinition } from "../../engine/scene/mod.ts";

const workerData = JSON.parse(Deno.env.get("DREAMLAB_MP_WORKER_DATA")!) as WorkerInitData;
Deno.env.delete("DREAMLAB_MP_WORKER_DATA");

const ipc = new IPCMessageBus(workerData);
await ipc.connected();

// TODO: handle schema serialization request from IPC

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

// TODO: how is multi-scene actually going to work lol
const projectDesc = await fetch(game.resolveResource("res://world.json"))
  .then(r => r.text())
  .then(JSON.parse)
  .then(ProjectSchema.parse);
await loadSceneDefinition(game, projectDesc.scenes.main);

game.setStatus(GameStatus.Running);
