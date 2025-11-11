import { Codec, getCodec, isCodec } from "@dreamlab/proto/codecs/mod.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import { Application, Router, Status } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

import { z } from "@dreamlab/vendor/zod.ts";
import * as uuid from "jsr:@std/uuid@1.0.9";
import { serveWorlds } from "../common-host/routes/worlds.ts";
import {
  handleJsonAPIErrors,
  JsonAPIError,
  typedJsonHandler,
} from "../common-host/web-util/api.ts";
import { workerConnectHandler } from "../common-host/worker.ts";
import { importSecretKey, validateAuthToken } from "../server-common/game-auth.ts";
import type { WorkerIPCMessage } from "../server-common/ipc.ts";
import { reportPlayerCount, teardownActor } from "./actor-reporting.ts";
import { CONFIG } from "./config.ts";
import { PlayInstance } from "./instance.ts";

const instance = new PlayInstance(CONFIG.INSTANCE_ID, CONFIG.WORLD_ID);

const app = new Application();
const router = new Router();

router.get("/internal/worker", workerConnectHandler);

const gameAuthSecret = CONFIG.NEXT_GAME_JWT_SECRET
  ? await importSecretKey(CONFIG.NEXT_GAME_JWT_SECRET)
  : undefined;

router.get("/api/v1/connect/:instance", async ctx => {
  if (ctx.params.instance !== instance.instanceId)
    throw new JsonAPIError(Status.MisdirectedRequest, "not running this instance");

  await instance.ready();

  const codecParam = ctx.request.url.searchParams.get("codec") ?? undefined;
  const codecName: Codec | undefined = isCodec(codecParam) ? codecParam : undefined;
  const codec = getCodec(codecName);

  const connectionId = createId("conn");
  if (!gameAuthSecret) {
    const playerId = ctx.request.url.searchParams.get("player_id");
    const nickname = ctx.request.url.searchParams.get("nickname") ?? "Player";
    if (!(playerId && nickname))
      throw new JsonAPIError(Status.BadRequest, "missing player_id / nickname");

    const socket = ctx.upgrade();
    instance.handleConnection(connectionId, socket, codec, playerId, nickname);
  } else {
    const token = ctx.request.url.searchParams.get("token");
    if (token === null)
      throw new JsonAPIError(Status.Unauthorized, "auth token was not provided");
    const auth = await validateAuthToken(gameAuthSecret, token);

    const expectedInstanceId =
      instance.instanceId === "standalone"
        ? await uuid.v5.generate(
            "dfd8e476-f776-475c-ac09-d2baf1a43a4a", // random namespace
            new TextEncoder().encode(CONFIG.WORLD_ID),
          )
        : instance.instanceId;
    if (auth.instance_id !== expectedInstanceId)
      throw new JsonAPIError(Status.Unauthorized, "invalid session for given instance");

    const socket = ctx.upgrade();
    instance.handleConnection(connectionId, socket, codec, auth.player_id, auth.nickname);
  }
});

router.post(
  "/api/v1/instance/:instance/call",
  typedJsonHandler(
    {
      body: z.object({ identifier: z.string(), params: z.array(z.unknown()) }),
      response: z.discriminatedUnion("status", [
        z.object({ status: z.literal("ok"), result: z.unknown() }),
        z.object({ status: z.literal("error"), error: z.unknown() }),
      ]),
    },
    async (ctx, { body }) => {
      if (ctx.params.instance !== instance.instanceId)
        throw new JsonAPIError(Status.MisdirectedRequest, "not running this instance");

      await instance.ready();
      const ipc = instance.ipc!; // ipc can't be undefined because instance is ready

      const callId = crypto.randomUUID();
      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        // @ts-expect-error polymorphic listener function
        ipc.removeMessageListener(responseListener);
        cleanedUp = true;
      };
      const responsePromise = Promise.withResolvers<unknown>();
      const responseListener = (
        message: WorkerIPCMessage & { op: "HttpAPIResponse" | "HttpAPIError" },
      ) => {
        if (message.callId !== callId) return;
        switch (message.op) {
          case "HttpAPIResponse": {
            responsePromise.resolve(message.result);
            cleanup();
            break;
          }
          case "HttpAPIError": {
            responsePromise.reject(message.error);
            cleanup();
            break;
          }
        }
      };
      ipc.addMessageListener("HttpAPIResponse", responseListener);
      ipc.addMessageListener("HttpAPIError", responseListener);
      ipc.send({
        op: "HttpAPICall",
        callId,
        route: body.identifier,
        params: body.params,
      });

      try {
        const sleep = new Promise<void>((_, rej) => setTimeout(() => rej("timed out"), 5000));
        const res = await Promise.race([responsePromise.promise, sleep]);
        return { status: "ok", result: res } as const;
      } catch (err) {
        return { status: "error", error: err } as const;
      }
    },
  ),
);

// TODO: instance info route

serveWorlds(router, new Map());

if (CONFIG.STANDALONE) {
  router.get("/:path*", async ctx => {
    try {
      await ctx.send({
        root: "./client",
        index: "index.html",
        immutable: ctx.request.url.pathname.startsWith("/dist/"),
      });
    } catch (_err) {
      ctx.response.body = "Not Found";
      ctx.response.type = "text/plain";
      ctx.response.status = Status.NotFound;
    }
  });
} else {
  router.get("/", ctx => {
    ctx.response.body = { ...instance.richStatus, status: "dreamlab play-host running..." };
    ctx.response.type = "application/json";
  });
}

handleJsonAPIErrors(app, true);
app.use(async (ctx, next) => {
  await next();
  if (ctx.response.status === undefined) {
    ctx.response.body = "Not Found";
    ctx.response.type = "text/plain";
    ctx.response.status = Status.NotFound;
  }
});
app.use(oakCors({ allowedHeaders: "Content-Type,Authorization" }));
app.use(router.routes());
app.use(router.allowedMethods());

const webAbort = new AbortController();

const main = async () => {
  await Promise.all([
    (async () => {
      await instance.boot();
      await reportPlayerCount(instance);
    })(),
    (async () => {
      const addr = CONFIG.BIND_ADDRESS;
      console.log(`Listening: http://${addr.hostname}:${addr.port} ...`);
      await app.listen({
        hostname: addr.hostname,
        port: addr.port,
        signal: webAbort.signal,
      });
    })(),
  ]);
};

const shutdown = async () => {
  console.log("Shutting down.");
  await teardownActor(instance);
  webAbort.abort();
  instance.ipc?.destroy();
  Deno.exit(0);
};

Deno.addSignalListener("SIGINT", () => {
  void shutdown();
});
try {
  Deno.addSignalListener("SIGTERM", () => {
    void shutdown();
  });
} catch (_err) {
  // ignore: we can't addSignalListener these on Windows
}

const cleanupSecs = CONFIG.AUTO_CLEANUP_IDLE_SECS;
console.log({ cleanupSecs });
if (cleanupSecs) {
  let lastActive = Date.now();

  setInterval(() => {
    if (instance.connections.size > 0) lastActive = Date.now();

    const idleSecs = (Date.now() - lastActive) / 1000;
    if (idleSecs < cleanupSecs) return;

    console.log(`Shutting down because we've been idle for ${idleSecs.toFixed(0)} seconds.`);
    shutdown();
  }, 1_000);
}

await main();
