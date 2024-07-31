import { Application, Router, Status } from "../deps/oak.ts";
import { handleJsonAPIErrors } from "./util/api.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

import { workerInternalRoute } from "./worker.ts";
import { serveInstanceManagementAPI } from "./routes/instance-management.ts";
import { serveWorlds } from "./routes/worlds.ts";
import { servePlayRoutes } from "./routes/play.ts";
import { serveLogStreamingAPI } from "./routes/log-streaming.ts";

export const setupWeb = async (app: Application) => {
  const router = new Router();

  router.get("/internal/worker", workerInternalRoute);
  servePlayRoutes(router);
  serveWorlds(router);
  serveInstanceManagementAPI(router);
  serveLogStreamingAPI(router);
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
