import { Router, Status } from "../../deps/oak.ts";
import * as path from "jsr:@std/path@1";

export const serveWorlds = (router: Router) => {
  // TODO: world variants?
  router.get("/worlds/:user/:world/:resource*", async ctx => {
    const { user, world, resource } = ctx.params;
    try {
      await ctx.send({
        root: path.join("./worlds/", user, world),
        path: resource,
      });
    } catch (err) {
      console.warn(err);
      ctx.response.status = Status.NotFound;
      ctx.response.body = "Not Found";
      ctx.response.type = "text/plain";
    }
  });
};
