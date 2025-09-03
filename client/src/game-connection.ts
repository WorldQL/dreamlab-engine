import { ClientGame, KvClient } from "@dreamlab/engine";
import { Codec, getCodec, isCodec, PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import { PlayPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import { ClientConnection } from "./networking/net-connection.ts";

export const pickCodec = (
  url: URL,
  codec: (Codec | (string & Record<never, never>)) | undefined,
): PlayCodec => {
  const codecType = isCodec(codec) ? codec : undefined;
  const playCodec = getCodec(codecType);

  if (codecType) url.searchParams.set("codec", codecType);
  return playCodec;
};

export const connectToGame = (
  instanceId: string,
  container: HTMLDivElement,
  socket: WebSocket,
  codec: PlayCodec,
  cacheBust: boolean = false,
): Promise<[game: ClientGame, conn: ClientConnection, handshake: PlayPacket<"Handshake">]> => {
  socket.binaryType = "arraybuffer";

  return new Promise(resolve => {
    let conn: ClientConnection | undefined;
    let game: ClientGame | undefined;
    socket.addEventListener("message", event => {
      const packet = codec.decodePacket(event.data) as ServerPacket;
      if (game === undefined && packet.t === "Handshake") {
        const connectionId = packet.connection_id;
        const worldId = packet.world_id;

        // TODO: grab nickname / playerId from packet (we should have a PeerInfo concept)
        conn = new ClientConnection(connectionId, socket, codec);
        game = new ClientGame({
          instanceId,
          worldId,
          container,
          network: conn.createNetworking(),
          cacheBuster: cacheBust ? createId("cch", { secure: false }) : undefined,
          kv: game => new KvClient({ game }),
          ticksPerSecond: packet.tick_rate,
        });
        game.worldScriptBaseURL = new URL(
          packet.world_script_base_url,
          window.location.href,
        ).toString();
        conn.setup(game);
        resolve([game, conn, packet]);
      } else if (conn !== undefined) {
        conn.handle(packet);
      } else {
        console.debug("dropped message!", event);
      }
    });
  });
};
