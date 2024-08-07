import { Context, Router, Status } from "../../deps/oak.ts";
import { ClientPacketSchema } from "@dreamlab/proto/play.ts";
import { JSON_CODEC } from "@dreamlab/proto/codecs/simple-json.ts";

import { GameSession } from "../../session.ts";
import { GameInstance } from "../../instance.ts";
import { JsonAPIError } from "../util/api.ts";

const handlePlayerConnectionRequest = (ctx: Context, session: GameSession) => {
  const nickname = ctx.request.url.searchParams.get("nickname");
  if (nickname === null) throw new JsonAPIError(Status.BadRequest, "Missing nickname");
  // temporary: to be replaced with JWT
  const playerId = ctx.request.url.searchParams.get("player_id");
  if (playerId === null) throw new JsonAPIError(Status.BadRequest, "Missing player_id");

  const socket = ctx.upgrade();

  const connection = {
    connectionId: crypto.randomUUID(),
    socket,
    codec: JSON_CODEC,
  };
  session.connections.set(connection.connectionId, connection);
  socket.addEventListener("close", () => {
    session.ipc.send({
      op: "ConnectionDropped",
      connectionId: connection.connectionId,
    });
    session.connections.delete(connection.connectionId);
  });

  socket.addEventListener("message", event => {
    try {
      const packet = ClientPacketSchema.parse(connection.codec.decodePacket(event.data));
      session.ipc.send({
        op: "IncomingPacket",
        from: connection.connectionId,
        packet,
      });

      session.parent.bumpIdleTime();
    } catch {
      // skip
    }
  });

  const onReady = () => {
    session.ipc.send({
      op: "ConnectionEstablished",
      nickname,
      playerId,
      connectionId: connection.connectionId,
    });
    session.parent.bumpIdleTime();
  };

  if (socket.readyState === WebSocket.OPEN) {
    onReady();
  } else {
    socket.addEventListener("open", () => onReady());
  }
};

export const servePlayRoutes = (router: Router) => {
  router.get("/status", ctx => {
    ctx.response.body = "up ^-^";
  });

  router.get("/api/v1/connect/:instance", async ctx => {
    const instanceId = ctx.params.instance;
    const instance: GameInstance | undefined = GameInstance.INSTANCES.get(instanceId); // TODO
    if (instance === undefined)
      throw new JsonAPIError(
        Status.ServiceUnavailable,
        "No instance with the given ID exists.",
      );

    // TODO: potentially race a sleep 10_000ms and a instance.waitForSessionBoot

    if (instance.session === undefined)
      throw new JsonAPIError(
        Status.ServiceUnavailable,
        "The instance with the given ID is not running a session.",
      );

    handlePlayerConnectionRequest(ctx, instance.session);
  });
};
