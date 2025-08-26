import { Application, Router, Status } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { handleJsonAPIErrors } from "../../common-host/web-util/api.ts";

import { serveWorlds } from "../../common-host/routes/worlds.ts";
import { workerConnectHandler } from "../../common-host/worker.ts";
import { CONFIG } from "../config.ts";
import { GameInstance, GameInstanceState } from "../instance.ts";
import { serveDiscordRoutes } from "./routes/discord.ts";
import { serveInstanceManagementAPI } from "./routes/instance-management.ts";
import { serveLogStreamingAPI } from "./routes/log-streaming.ts";
import { servePlayRoutes } from "./routes/play.ts";
import { serveSchemas } from "./routes/schemas.ts";
import { serveScriptEditingAPI } from "./routes/script-editing.ts";
import { serveSourceControlAPI } from "./routes/source-control.ts";

export const setupWeb = async (app: Application) => {
  const router = new Router();

  router.get("/internal/worker", workerConnectHandler);
  await servePlayRoutes(router);
  serveWorlds(router, GameInstance.INSTANCES);
  serveSchemas(router);
  serveInstanceManagementAPI(router);
  serveLogStreamingAPI(router);
  serveScriptEditingAPI(router);
  serveSourceControlAPI(router);
  await serveDiscordRoutes(router);
  router.get("/", ctx => {
    const instanceCount = GameInstance.INSTANCES.values()
      .filter(it => it.state === GameInstanceState.Running)
      .toArray().length;
    ctx.response.body = `dreamlab multiplayer running ${instanceCount} instances...`;
    ctx.response.type = "text/plain";
  });
  /* router.get("/:path*", ctx =>
    ctx
      .send({
        root: "../client/web",
        index: "index.html",
        path: ctx.request.url.pathname,
      })
      .catch(_e => {}),
  ); */

  handleJsonAPIErrors(app, CONFIG.IS_DEV);
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
