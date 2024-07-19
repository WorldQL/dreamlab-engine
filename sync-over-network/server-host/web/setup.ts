import { Application, Router, Status } from "../deps/oak.ts";
import { handleJsonAPIErrors, JsonAPIError } from "./util.ts";

import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { workerInternalRoute } from "./worker.ts";
import { GameInstance } from "../game-instance.ts";
import { handlePlayerConnectionRequest } from "./play.ts";

export const setupWeb = async (app: Application) => {
  const router = new Router();

  router.get("/internal/worker", workerInternalRoute);
  router.get("/status", ctx => {
    ctx.response.body = "up ^-^";
  });
  router.get("/api/v1/connect/:instance", async ctx => {
    const instanceId = ctx.params.instance;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined)
      throw new JsonAPIError(
        Status.ServiceUnavailable,
        "No instance with the given ID exists.",
      );

    // TODO: ensure instance is booted

    await handlePlayerConnectionRequest(ctx, instance);
  });

  router.get("/worlds/:path*", ctx => {
    // TODO: server from world dist
    ctx.response.status = Status.NotImplemented;
  });
  router.get("/:path*", ctx =>
    ctx
      .send({
        root: "./client",
        index: "index.html",
        path: ctx.request.url.pathname,
      })
      .catch(_e => {}),
  );

  handleJsonAPIErrors(app);
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
};