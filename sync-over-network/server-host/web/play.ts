import { ClientPacketSchema } from "@dreamlab/proto/play.ts";
import { Context, Status } from "../deps/oak.ts";
import { GameInstance } from "../game-instance.ts";
import { JsonAPIError } from "./util.ts";
import { JSON_CODEC } from "@dreamlab/proto/codecs/simple-json.ts";

export const handlePlayerConnectionRequest = async (ctx: Context, instance: GameInstance) => {
  const nickname = ctx.request.url.searchParams.get("nickname");
  if (nickname === null) throw new JsonAPIError(Status.BadRequest, "Missing nickname");
  // temporary: to be replaced with JWT
  const playerId = ctx.request.url.searchParams.get("player_id");
  if (playerId === null) throw new JsonAPIError(Status.BadRequest, "Missing player_id");

  const connection = {
    connectionId: crypto.randomUUID(),
    socket: ctx.upgrade(),
    codec: JSON_CODEC,
  };
  instance.connections.set(connection.connectionId, connection);
  connection.socket.addEventListener("close", () => {
    instance.ipc.send({
      op: "ConnectionDropped",
      connectionId: connection.connectionId,
    });
    instance.connections.delete(connection.connectionId);
  });

  connection.socket.addEventListener("message", event => {
    try {
      const packet = ClientPacketSchema.parse(connection.codec.decodePacket(event.data));
      instance.ipc.send({
        op: "IncomingPacket",
        from: connection.connectionId,
        packet,
      });

      console.log(`[<-] ${packet.t}`);
    } catch {
      // skip
    }
  });

  const onReady = () => {
    instance.ipc.send({
      op: "ConnectionEstablished",
      nickname,
      playerId,
      connectionId: connection.connectionId,
    });
  };

  if (connection.socket.readyState === WebSocket.OPEN) {
    onReady();
  } else {
    connection.socket.addEventListener("open", () => onReady());
  }
};
