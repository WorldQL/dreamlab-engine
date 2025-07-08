import { Codec, getCodec, isCodec, PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import { ClientPacketSchema } from "@dreamlab/proto/play.ts";
import { Context, Router, Status } from "@oak/oak";

import { createId } from "@dreamlab/vendor/nanoid.ts";
import { JsonAPIError } from "../../../common-host/web-util/api.ts";
import { importSecretKey, validateAuthToken } from "../../../server-common/game-auth.ts";
import { CONFIG } from "../../config.ts";
import { bootPlaySession, GameInstance } from "../../instance.ts";
import { GameSession } from "../../session.ts";

const handleConnection = (
  socket: WebSocket,
  session: GameSession,
  playerId: string,
  nickname: string,
  codec: PlayCodec,
) => {
  const connection = {
    connectionId: createId("conn"),
    socket,
    codec,
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

const handlePlayerConnectionRequest = async (
  ctx: Context,
  gameAuthSecret: CryptoKey,
  session: GameSession,
) => {
  const codecParam = ctx.request.url.searchParams.get("codec") ?? undefined;
  const codec: Codec | undefined = isCodec(codecParam) ? codecParam : undefined;

  if (CONFIG.IS_DEV) {
    const playerId = ctx.request.url.searchParams.get("player_id");
    const nickname = ctx.request.url.searchParams.get("nickname");
    if (nickname && playerId) {
      handleConnection(ctx.upgrade(), session, playerId, nickname, getCodec(codec));
      return;
    }
  }

  const token = ctx.request.url.searchParams.get("token");
  if (token === null)
    throw new JsonAPIError(Status.Unauthorized, "No auth token was provided.");

  try {
    const auth = await validateAuthToken(gameAuthSecret, token);
    if (auth.instance_id !== session.parent.info.instanceId) throw new Error("invalid session");

    handleConnection(ctx.upgrade(), session, auth.player_id, auth.nickname, getCodec(codec));
  } catch (err) {
    throw new JsonAPIError(Status.Forbidden, "The auth token provided was invalid.", {
      reason: err.message,
    });
  }
};

export const servePlayRoutes = async (router: Router) => {
  const gameAuthSecret = await importSecretKey(CONFIG.NEXT_GAME_JWT_SECRET);

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

    const usePlaySession =
      ctx.request.url.searchParams.get("play_session") && instance.info.editMode;

    await Promise.race([
      new Promise(res => setTimeout(res, 5_000)),
      usePlaySession ? instance.waitForPlaySessionBoot() : instance.waitForSessionBoot(),
    ]);

    let session = instance.session;
    if (session === undefined)
      throw new JsonAPIError(
        Status.ServiceUnavailable,
        "The instance with the given ID is not running a session.",
      );

    if (usePlaySession) {
      if (!instance.playSession) await bootPlaySession(instance);

      session = instance.playSession;
      if (session === undefined)
        throw new JsonAPIError(
          Status.ServiceUnavailable,
          "The instance with the given ID is not running a play session.",
        );
    }

    await handlePlayerConnectionRequest(ctx, gameAuthSecret, session);
  });
};
