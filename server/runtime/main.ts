import { GameStatus, ServerGame } from "@dreamlab/engine";
import { WorkerInitData } from "../common/worker-data.ts";
import { ServerNetworkManager } from "./networking/net-manager.ts";
import { IPCMessageBus } from "./ipc.ts";

import { Scene, loadSceneDefinition } from "../../engine/scene/mod.ts";

export const SAMPLE_SCENE: Scene = {
  world: [
    {
      ref: "ent_l1wx3qcq9xxy5bg6u8n036wy",
      name: "DefaultSquare",
      type: "@core/Rigidbody2D",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
      values: { type: "fixed" },
    },
    {
      ref: "ent_kkm6r17dsj197dla0iu9fbjp",
      name: "DefaultSquare.1",
      type: "@core/Rigidbody2D",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
      values: { type: "fixed" },
    },
    {
      ref: "ent_qitlau9pgtq5y8wmxuym0paf",
      name: "SpriteContainer",
      type: "@core/Empty",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 2, y: 1 }, z: 0 },
      values: {},
      children: [
        {
          ref: "ent_ame972vw6ejknflhvv35n2xp",
          name: "Sprite",
          type: "@core/Sprite2D",
          transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
          values: { width: 1, height: 1, alpha: 1, texture: "" },
          behaviors: [
            {
              ref: "bhv_dgneu7qncn6wxed6rgvoww5u",
              values: { speed: 1 },
              script: "builtin:jackson.test/WASDMovementBehavior",
            },
          ],
        },
      ],
    },
  ],
};

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

loadSceneDefinition(game, SAMPLE_SCENE);

game.setStatus(GameStatus.Running);
console.log("eyyyy i'm runnin a game ova here");

// TODO: run the tick loop properly (run at 2x rate + do delta accumulation)
setInterval(() => {
  game.tick();
}, 1_000 / game.time.TPS);
