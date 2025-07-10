import { Codec, getCodec, isCodec } from "@dreamlab/proto/codecs/mod.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import { Application, Router, Status } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

import * as uuid from "jsr:@std/uuid@1.0.9";
import { serveWorlds } from "../common-host/routes/worlds.ts";
import { handleJsonAPIErrors, JsonAPIError } from "../common-host/web-util/api.ts";
import { workerConnectHandler } from "../common-host/worker.ts";
import { importSecretKey, validateAuthToken } from "../server-common/game-auth.ts";
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

// TODO: instance info route

serveWorlds(router);

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
