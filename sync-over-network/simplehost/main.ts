import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { Application, Router, Status } from "../server-host/deps/oak.ts";
import * as path from "jsr:@std/path@1";

const app = new Application();
const router = new Router();

router.get("/worlds/:user/:world/:resource*", async ctx => {
  const { user, world, resource } = ctx.params;
  try {
    await ctx.send({
      root: path.join("./worlds/", user, world, "_dist"),
      path: resource,
    });
  } catch (err) {
    console.warn(err);
    ctx.response.status = Status.NotFound;
    ctx.response.body = "Not Found";
    ctx.response.type = "text/plain";
  }
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

console.log(`Listening: http://127.0.0.1:9999 ...`);
await app.listen({ port: 9999 });
