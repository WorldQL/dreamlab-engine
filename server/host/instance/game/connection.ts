import { Context, Status } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { jsonError } from "../../web/util.ts";
import { unsafeDecodeAuthToken, validateAuthToken } from "./auth.ts";
import type { AuthToken } from "./auth.ts";
import type { GameRuntimeInstance, PlayerConnection } from "./runtime.ts";
import { ClientPacketSchema } from "@dreamlab/proto/play.ts";

import * as log from "../../util/log.ts";
import { APP_CONFIG } from "../../config.ts";

export const handlePlayerConnection = (
  auth: AuthToken,
  socket: WebSocket,
  instance: GameRuntimeInstance,
) => {
  const connection: PlayerConnection = {
    id: crypto.randomUUID(),
    socket,
  };

  log.debug("handling new connection", {
    conn: connection.id,
    nickname: auth.nickname,
  });

  instance.connections.set(connection.id, connection);
  socket.addEventListener("close", () => {
    log.debug("connection dropped", { conn: connection.id });

    instance.ipc.send({
      op: "ConnectionDropped",
      connectionId: connection.id,
    });
    instance.connections.delete(connection.id);
  });

  socket.addEventListener("message", event => {
    const data = event.data;
    if (typeof data === "string") {
      try {
        const packet = ClientPacketSchema.parse(JSON.parse(data));
        instance.ipc.send({
          op: "IncomingPacket",
          from: connection.id,
          packet,
        });
      } catch {
        // skip
      }
    }
  });

  const onReady = () => {
    log.debug("socket ready!", { player: auth.nickname });

    instance.ipc.send({
      op: "ConnectionEstablished",
      nickname: auth.nickname,
      playerId: auth.player_id,
      connectionId: connection.id,
    });
  };

  log.debug("socket state", {
    player: auth.nickname,
    state: socket.readyState,
  });
  if (socket.readyState === WebSocket.OPEN) {
    onReady();
  } else {
    socket.addEventListener("open", () => onReady());
  }
};

export const handlePlayerConnectionRequest = async (
  ctx: Context,
  authSecret: CryptoKey,
  game: GameRuntimeInstance,
) => {
  if (APP_CONFIG.isDev) {
    const nickname = ctx.request.url.searchParams.get("nickname");
    const playerId = ctx.request.url.searchParams.get("player_id");
    if (nickname && playerId) {
      const auth: AuthToken = {
        instance_id: game.parent.instanceId,
        nickname,
        player_id: playerId,
        world: game.parent.worldId,
        guest: true,
      };
      const socket = ctx.upgrade();
      return handlePlayerConnection(auth, socket, game);
    }
  }

  const token = ctx.request.url.searchParams.get("token");
  if (token === null) {
    jsonError(ctx, Status.Unauthorized, "No auth token was provided.");
    return;
  }

  try {
    const auth = await validateAuthToken(authSecret, token);
    const playerSocket = ctx.upgrade();
    handlePlayerConnection(auth, playerSocket, game);
  } catch (err) {
    jsonError(ctx, Status.Forbidden, "The auth token provided was invalid.", {
      reason: err.message,
    });

    try {
      const auth = unsafeDecodeAuthToken(token);
      game.parent.logs.warn("Player failed to connect", {
        error: err.message,
        auth,
      });
    } catch {
      // ignore
    }

    return;
  }
};
