import { ClientGame, GameStatus } from "@dreamlab/engine";
import { JSON_CODEC } from "@dreamlab/proto/codecs/simple-json.ts";
import { ServerPacket } from "@dreamlab/proto/play.ts";
import { ClientConnection } from "./networking/net-connection.ts";

const setup = async (conn: ClientConnection, game: ClientGame) => {
  conn.setup(game);
  await game.initialize();

  // TODO: load test world

  game.setStatus(GameStatus.Running);

  /* game.world.spawn({
    type: Sprite2D,
    name: "Player." + conn.id,
    behaviors: [
      {
        type: await game.loadBehavior("/worlds/dreamlab/test-world/player.js"),
      },
    ],
  }); */

  let now = performance.now();
  const onTick = (time: number) => {
    const delta = time - now;
    now = time;
    game.tickClient(delta);

    requestAnimationFrame(onTick);
  };

  requestAnimationFrame(onTick);
};

const instanceId = "my-instance";
const socket = new WebSocket(
  `/api/v1/connect/${instanceId}?nickname=${encodeURIComponent("Player" + Math.floor(Math.random() * 999) + 1)}&player_id=${encodeURIComponent(crypto.randomUUID())}`,
);
Object.defineProperty(window, "socket", { value: socket });
const codec = JSON_CODEC;

let conn: ClientConnection | undefined;
let game: ClientGame | undefined;
socket.addEventListener("message", async event => {
  const packet = codec.decodePacket(event.data) as ServerPacket;
  if (game === undefined && packet.t === "Handshake") {
    const connectionId = packet.connection_id;
    const worldId = packet.world_id;

    // TODO: grab nickname / playerId from packet (we should have a PeerInfo concept)
    conn = new ClientConnection(connectionId, socket, codec);
    game = new ClientGame({
      instanceId,
      worldId,
      container: document.querySelector("#app")!,
      network: conn.createNetworking(),
    });
    Object.defineProperties(window, { game: { value: game }, conn: { value: conn } });
    await setup(conn, game);
  } else if (conn !== undefined) {
    conn.handle(packet);
  } else {
    console.debug("dropped message!", event);
  }
});
