import { ClientGame, GameStatus } from "@dreamlab/engine";
import { JSON_CODEC } from "@dreamlab/proto/codecs/simple-json.ts";
import { ServerPacket } from "@dreamlab/proto/play.ts";
import { ClientConnection } from "./networking/net-connection.ts";
import { ReceivedInitialNetworkSnapshot } from "../../networking-shared/signals.ts";

const setup = async (conn: ClientConnection, game: ClientGame) => {
  const networkSetupPromise = new Promise<void>((resolve, _reject) => {
    game.on(ReceivedInitialNetworkSnapshot, () => {
      resolve();
    });
  });

  conn.setup(game);
  await game.initialize();

  await networkSetupPromise;

  game.setStatus(GameStatus.Running);

  const { default: clientMain } = await import(
    game.resolveResource("res://temp-client-main.js")
  );
  await clientMain(game);

  let now = performance.now();
  const onTick = (time: number) => {
    const delta = time - now;
    now = time;
    game.tickClient(delta);

    requestAnimationFrame(onTick);
  };

  requestAnimationFrame(onTick);
};

const instanceId = "00000000-0000-0000-0000-000000000000";
const socket = new WebSocket(
  `ws://127.0.0.1:8000/api/v1/connect/${instanceId}?nickname=${encodeURIComponent("Player" + Math.floor(Math.random() * 999) + 1)}&player_id=${encodeURIComponent(crypto.randomUUID())}`,
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
    game.worldScriptBaseURL = packet.world_script_base_url;
    console.log(packet);
    Object.defineProperties(window, { game: { value: game }, conn: { value: conn } });
    await setup(conn, game);
  } else if (conn !== undefined) {
    conn.handle(packet);
  } else {
    console.debug("dropped message!", event);
  }
});
