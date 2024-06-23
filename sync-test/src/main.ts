import { ServerGame, ClientGame, SyncedValueChanged, Game } from "@dreamlab/engine";
import { setupLevel } from "./level.ts";

const instanceId = crypto.randomUUID();
const worldId = crypto.randomUUID();

const server = new ServerGame({
  instanceId,
  worldId,
});

const client1 = new ClientGame({
  connectionId: "1",
  instanceId,
  worldId,
  container: document.querySelector("#app1")!,
});

const client2 = new ClientGame({
  connectionId: "2",
  instanceId,
  worldId,
  container: document.querySelector("#app2")!,
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
