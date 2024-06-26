import { ServerGame, ClientGame, SyncedValueChanged, Game } from "@dreamlab/engine";
import { setupLevel } from "./level.ts";
import { ServerNetworkManager } from "./network.ts";

const instanceId = crypto.randomUUID();
const worldId = crypto.randomUUID();

const netManager = new ServerNetworkManager();

const server = new ServerGame({
  instanceId,
  worldId,
  network: netManager.createNetworking(),
});

const conn1 = netManager.connect();
const client1 = new ClientGame({
  instanceId,
  worldId,
  container: document.querySelector("#app1")!,
  network: conn1.createNetworking(),
});

const conn2 = netManager.connect();
const client2 = new ClientGame({
  instanceId,
  worldId,
  container: document.querySelector("#app2")!,
  network: conn2.createNetworking(),
});

Object.defineProperties(window, {
  server: { value: server },
  client1: { value: client1 },
  client2: { value: client2 },
});

const rebroadcastValueChanges = (game: Game, peers: Game[]) => {
  game.syncedValues.on(SyncedValueChanged, event => {
    if (event.originator !== game.syncedValues.originator) return;
    const valueIdentifier = event.value.identifier;
    for (const peer of peers) {
      const peerValue = peer.syncedValues.values.find(v => v.identifier === valueIdentifier);
      if (!peerValue) continue;
      peer.syncedValues.fire(
        SyncedValueChanged,
        peerValue,
        event.newValue,
        event.generation,
        event.originator,
      );
    }
  });
};

const games: Game[] = [server, client1, client2];
for (const game of games) {
  const peers = games.filter(g => g !== game);
  rebroadcastValueChanges(game, peers);
}

await Promise.all(games.map(game => setupLevel(game)));

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
