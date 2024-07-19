import { ClientGame, GameStatus } from "@dreamlab/engine";
import { JSON_CODEC } from "@dreamlab/proto/codecs/simple-json.ts";
import { ServerPacket } from "@dreamlab/proto/play.ts";
import { ClientConnection } from "./networking/net-connection.ts";

const setup = async (conn: ClientConnection, game: ClientGame) => {
  conn.setup(game);
  await game.initialize();

  game.setStatus(GameStatus.Running);

  // TODO: load test world
};

const instanceId = "my-instance";
const socket = new WebSocket(
  `/api/v1/connect/${instanceId}?nickname=${encodeURIComponent("Player" + Math.floor(Math.random() * 999) + 1)}&player_id=${encodeURIComponent(crypto.randomUUID())}`,
);
Object.defineProperty(window, "socket", { value: socket });
const codec = JSON_CODEC;
socket.addEventListener("message", async event => {
  console.log(event);

  let conn: ClientConnection | undefined;
  let game: ClientGame | undefined;
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
    Object.defineProperty(window, "game", { value: game });
    await setup(conn, game);
  } else if (conn !== undefined) {
    conn.handle(packet);
  }
});
