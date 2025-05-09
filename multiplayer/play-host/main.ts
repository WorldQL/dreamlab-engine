import { Codec, getCodec, isCodec } from "@dreamlab/proto/codecs/mod.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import { Application, Router, Status } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

import { serveWorlds } from "../common-host/routes/worlds.ts";
import { handleJsonAPIErrors, JsonAPIError } from "../common-host/web-util/api.ts";
import { workerConnectHandler } from "../common-host/worker.ts";
import { CONFIG } from "./config.ts";
import { PlayInstance } from "./instance.ts";

const instance = new PlayInstance(CONFIG.INSTANCE_ID, CONFIG.WORLD_ID);

const app = new Application();
const router = new Router();

router.get("/internal/worker", workerConnectHandler);

router.get("/api/v1/connect/:instance", async ctx => {
  if (ctx.params.instance !== instance.instanceId)
    throw new JsonAPIError(Status.MisdirectedRequest, "not running this instance");

  await instance.ready();

  const connectionId = createId("conn");
  const playerId = ctx.request.url.searchParams.get("player_id");
  const nickname = ctx.request.url.searchParams.get("nickname") ?? "Player";
  if (!(playerId && nickname))
    throw new JsonAPIError(Status.BadRequest, "missing player_id / nickname");

  const codecParam = ctx.request.url.searchParams.get("codec") ?? undefined;
  const codecName: Codec | undefined = isCodec(codecParam) ? codecParam : undefined;
  const codec = getCodec(codecName);

  const socket = ctx.upgrade();

  instance.handleConnection(connectionId, socket, codec, playerId, nickname);
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

await Promise.all([
  (async () => {
    await instance.boot();
  })(),
  (async () => {
    const addr = CONFIG.BIND_ADDRESS;
    console.log(`Listening: http://${addr.hostname}:${addr.port} ...`);
    await app.listen({
      hostname: addr.hostname,
      port: addr.port,
    });
  })(),
]);
