import { Application, Router, Status } from "oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { generate as generateUUIDv5 } from "@std/uuid/v5";
import { z } from "zod";

import { APP_CONFIG } from "../config.ts";
import { type AuthToken, importSecretKey, validateAuthToken } from "../instance/game/auth.ts";
import { handlePlayerConnectionRequest } from "../instance/game/connection.ts";
import { type RunningInstance } from "../instance/mod.ts";
import { discordRoutes } from "./discord.ts";
import { workerInternalRoute } from "./ipc-ws.ts";
import { instanceManagementRoutes } from "./instance-management.ts";
import { JsonAPIError, typedJsonHandler } from "./util.ts";
import { scriptEditRoutes } from "./script-editing.ts";
import { logStreamingRoutes } from "./log-streaming.ts";
import { sourceControlRoutes } from "./source-control.ts";
import { bootInstance } from "../instance/mod.ts";
import { createInstance } from "../instance/mod.ts";

export const listenWeb = async (
  instances: Map<string, RunningInstance>,
  signal: AbortSignal,
) => {
  const gameAuthSecret = await importSecretKey(APP_CONFIG.gameAuthSecret);

  const app = new Application();
  const router = new Router();

  router.get("/", ctx => {
    ctx.response.body = "dreamlab-mp-server running";
    ctx.response.type = "text/plain";
  });

  router.get("/api/v1/connect/:instance", async ctx => {
    const instanceId = ctx.params.instance;
    const instance = instances.get(instanceId);
    if (instance === undefined) {
      throw new JsonAPIError(
        Status.ServiceUnavailable,
        "No instance with the given ID exists.",
      );
    }

    try {
      await instance.booted();
    } catch {
      throw new JsonAPIError(Status.ServiceUnavailable, "The instance failed to start.");
    }

    if (instance.status === "Shut down") {
      try {
        await bootInstance(instance, true);
      } catch {
        throw new JsonAPIError(Status.ServiceUnavailable, "The instance failed to restart.");
      }
    }

    if (instance.game === undefined) {
      throw new JsonAPIError(Status.ServiceUnavailable, "The instance is not running.");
    }

    if (!ctx.isUpgradable) {
      throw new JsonAPIError(Status.BadRequest, "Must be a WebSocket request to connect");
    }

    await handlePlayerConnectionRequest(ctx, gameAuthSecret, instance.game);
  });

  router.post(
    "/api/v1/derive-instance/:source_instance",
    async (ctx, next) => {
      const token = ctx.request.headers.get("Authorization");
      if (token === null || !token.startsWith("Bearer ")) {
        throw new JsonAPIError(Status.Forbidden, "The given authorization token was invalid.");
      }

      try {
        const auth: AuthToken = await validateAuthToken(
          gameAuthSecret,
          token.substring("Bearer ".length),
        );
        ctx.state.auth = auth;
        return next();
      } catch {
        throw new JsonAPIError(Status.Forbidden, "The given authorization token was invalid.");
      }
    },
    typedJsonHandler(
      {
        body: z.object({
          world: z.string(),
        }),
        params: z.object({
          source_instance: z
            .string()
            .transform(id => instances.get(id))
            .refine((instance): instance is RunningInstance => instance !== undefined, {
              message: "No instance with the given ID exists.",
              params: { status: Status.NotFound },
            }),
        }),
        response: z.any(),
      },
      async (ctx, { body, params }) => {
        const auth: AuthToken = ctx.state.auth;
        const sourceInstance = params.source_instance;

        const originatingInstanceId =
          sourceInstance.originatingInstanceId ?? sourceInstance.instanceId;
        const originatingWorldId = sourceInstance.originatingWorldId ?? sourceInstance.worldId;

        const derivedInstanceId =
          body.world === originatingWorldId
            ? originatingInstanceId
            : await generateUUIDv5(
                originatingInstanceId,
                new TextEncoder().encode(body.world + "/" + sourceInstance.worldVariant),
              );

        if (!instances.has(derivedInstanceId)) {
          const instance = createInstance(
            derivedInstanceId,
            body.world,
            sourceInstance.worldVariant,
            {
              closeOnEmpty: sourceInstance.closeOnEmpty,
              publicURLBase: sourceInstance.urlBase,
              startedBy: auth.player_id,
              originatingInstanceId,
              originatingWorldId,
            },
          );
          instances.set(derivedInstanceId, instance);
        }

        const instance = instances.get(derivedInstanceId);
        if (instance === undefined) {
          throw new JsonAPIError(
            Status.InternalServerError,
            "Instance could not be successfully derived",
          );
        }

        await instance.booted();
        if (instance.status === "Shut down") {
          await bootInstance(instance, true);
        }

        return instance.info();
      },
    ),
  );

  // /api/v1/discord/auth (POST)
  discordRoutes(router, instances, gameAuthSecret);

  // /api/v1/instances (GET = list, PUT = create)
  // /api/v1/instance/:id (GET = detail, DELETE = shutdown)
  // /api/v1/restart-instance/:id (POST)
  instanceManagementRoutes(router, instances);

  // /api/v1/logs/:instance
  // /api/v1/log-stream/:instance
  logStreamingRoutes(router, instances);

  // /api/v1/edit/:instance_id/* (edit files, commit)
  scriptEditRoutes(router, instances);

  // /api/v1/source-control/:instance_id/*
  sourceControlRoutes(router, instances);

  // The advantage of having the worker IPC happen over WebSocket instead of via direct communication
  // (e.g. stdio pipe / unix socket) is that we can eventually move game workers onto another machine
  router.get("/internal/worker", workerInternalRoute);

  router.get("/worlds/:path*", async ctx => {
    const path = ctx.params.path;
    if (path === undefined) {
      ctx.response.body = "Not Found";
      ctx.response.type = "text/plain";
      ctx.response.status = Status.NotFound;
      return;
    }

    try {
      await ctx.send({ root: "./runtime/worlds", path, hidden: true });
    } catch {
      ctx.response.body = "Not Found: " + path;
      ctx.response.type = "text/plain";
      ctx.response.status = Status.NotFound;
    }
  });

  // 500 middleware (+ stack traces in dev)
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (err instanceof JsonAPIError) {
        ctx.response.body = Object.assign({ error: err.message }, err.extra ?? {});
        ctx.response.status = err.status;
        ctx.response.type = "application/json";
        return;
      }

      ctx.response.body = APP_CONFIG.isDev
        ? `Internal Error:\n\n${err.stack}`
        : "Internal Error";
      ctx.response.type = "text/plain";
      ctx.response.status = Status.InternalServerError;
    }
  });

  app.use(oakCors({ allowedHeaders: "Content-Type,Authorization" }));
  app.use(router.routes());
  app.use(router.allowedMethods());

  // 404 middleware
  app.use(async (ctx, next) => {
    await next();
    if (ctx.response.body === undefined) {
      ctx.response.body = "Not Found";
      ctx.response.type = "text/plain";
      ctx.response.status = Status.NotFound;
    }
  });

  await app.listen({
    hostname: APP_CONFIG.bindAddress.hostname,
    port: APP_CONFIG.bindAddress.port,
    signal,
  });
};
