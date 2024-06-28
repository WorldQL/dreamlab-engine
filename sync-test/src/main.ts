import { ServerGame, ClientGame, SyncedValueChanged, Game } from "@dreamlab/engine";
import { setupLevel } from "./level.ts";
import { ServerNetworkManager } from "./server/net-manager.ts";

const instanceId = crypto.randomUUID();
const worldId = crypto.randomUUID();

const netManager = new ServerNetworkManager();

const server = new ServerGame({
  instanceId,
  worldId,
  network: netManager.createNetworking(),
});
netManager.setup(server);

const conn1 = netManager.connect();
const client1 = new ClientGame({
  instanceId,
  worldId,
  container: document.querySelector("#app1")!,
  network: conn1.createNetworking(),
});
conn1.setup(client1);

const conn2 = netManager.connect();
const client2 = new ClientGame({
  instanceId,
  worldId,
  container: document.querySelector("#app2")!,
  network: conn2.createNetworking(),
});
conn2.setup(client2);

Object.defineProperties(window, {
  server: { value: server },
  client1: { value: client1 },
  client2: { value: client2 },
});

await Promise.all([server, client1, client2].map(game => setupLevel(game)));

let serverTickAcc = 0.0;
let serverNow = performance.now();
setInterval(() => {
  const now = performance.now();
  const delta = now - serverNow;
  serverNow = now;
  serverTickAcc += delta;
  while (serverTickAcc > server.time.delta) {
    serverTickAcc -= server.time.delta;
    server.tick();
  }
}, server.time.delta / 2);

let clientNow = performance.now();
const onFrame = (time: number) => {
  const delta = time - clientNow;
  clientNow = time;
  client1.tickClient(delta);
  client2.tickClient(delta);

  requestAnimationFrame(onFrame);
};
requestAnimationFrame(onFrame);
