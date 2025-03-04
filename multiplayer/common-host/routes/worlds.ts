import { Router, Status } from "@oak/oak";
import * as path from "@std/path";

export const serveWorlds = (router: Router) => {
  router.get("/worlds/:user/:world/:resource*", async ctx => {
    const { user, world, resource } = ctx.params;
    try {
      await ctx.send({
        root: path.join("./worlds/", user, world),
        path: resource,
      });
    } catch (_err) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = "Not Found";
      ctx.response.type = "text/plain";
    }
  });
};
