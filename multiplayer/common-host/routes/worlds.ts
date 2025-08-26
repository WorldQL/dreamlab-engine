import { Router, Status } from "@oak/oak";
import * as path from "@std/path";
import type { GameInstance } from "../../server-host/instance.ts";

export const serveWorlds = (router: Router, instances: Map<string, GameInstance>) => {
  router.get("/worlds/:user/:world/:resource*", async ctx => {
    const { user, world, resource } = ctx.params;
    if (user !== "external") {
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

      return;
    }

    const instance = [...instances.values()].find(
      ({ info }) => info.worldId === `${user}/${world}`,
    );

    if (!instance) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = "Not Found";
      ctx.response.type = "text/plain";
      return;
    }

    try {
      await ctx.send({
        root: instance.info.worldDirectory,
        path: resource,
      });
    } catch (_err) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = "Not Found";
      ctx.response.type = "text/plain";
    }
  });
};
