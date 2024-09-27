import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { Application, Router, Status } from "../deps/oak.ts";
import { handleJsonAPIErrors } from "./util/api.ts";

import { serveInstanceManagementAPI } from "./routes/instance-management.ts";
import { serveLogStreamingAPI } from "./routes/log-streaming.ts";
import { servePlayRoutes } from "./routes/play.ts";
import { serveSchemas } from "./routes/schemas.ts";
import { serveScriptEditingAPI } from "./routes/script-editing.ts";
import { serveSourceControlAPI } from "./routes/source-control.ts";
import { serveWorlds } from "./routes/worlds.ts";
import { workerInternalRoute } from "./worker.ts";

export const setupWeb = async (app: Application) => {
  const router = new Router();

  router.get("/internal/worker", workerInternalRoute);
  await servePlayRoutes(router);
  serveWorlds(router);
  serveSchemas(router);
  serveInstanceManagementAPI(router);
  serveLogStreamingAPI(router);
  serveScriptEditingAPI(router);
  serveSourceControlAPI(router);
  router.get("/:path*", ctx =>
    ctx
      .send({
        root: "../client/web",
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
