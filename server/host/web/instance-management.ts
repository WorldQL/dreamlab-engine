import { Router, Status } from "oak";

import { APP_CONFIG } from "../config.ts";
import { createInstance, InstanceInfoSchema, RunningInstance } from "../instance/mod.ts";

import { generate as generateUUIDv5 } from "@std/uuid/v5";

import { z } from "zod";

import { bearerTokenAuth, typedJsonHandler } from "./util.ts";
import { JsonAPIError } from "./util.ts";

export const instanceManagementRoutes = (
  router: Router,
  instances: Map<string, RunningInstance>,
) => {
  router.get(
    "/api/v1/instances",
    bearerTokenAuth(APP_CONFIG.coordAuthSecret),
    typedJsonHandler(
      {
        query: z.object({ world: z.string().optional() }),
        response: z.record(z.string(), InstanceInfoSchema),
      },
      async (_ctx, { query }) => {
        return Object.fromEntries(
          [...instances.entries()]
            .filter(([_id, instance]) =>
              query.world ? instance.worldId === query.world : true,
            )
            .map(([id, instance]) => [id, instance.info()]),
        );
      },
    ),
  );

  router.put(
    "/api/v1/instances",
    bearerTokenAuth(APP_CONFIG.coordAuthSecret),
    typedJsonHandler(
      {
        body: z.object({
          world_id: z.string(),
          started_by: z.string().optional(),
          edit_mode: z.boolean().optional(),
          nil: z.boolean().optional(),
          force_random_id: z.boolean().optional(),
          revision: z.string().optional(),
        }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { body }) => {
        const DREAMLAB_EDIT_NAMESPACE = "b2d25565-3f12-4acd-90bb-7883eee613fe";

        const instanceId =
          body.nil && APP_CONFIG.isDev
            ? "00000000-0000-0000-0000-000000000000"
            : body.edit_mode && !body.force_random_id
              ? await generateUUIDv5(
                  DREAMLAB_EDIT_NAMESPACE,
                  new TextEncoder().encode(body.world_id),
                )
              : crypto.randomUUID();

        const worldId = body.world_id;
        const worldVariant = body.edit_mode ? instanceId : "main";

        if (worldId.includes("../")) {
          throw new JsonAPIError(Status.BadRequest, "The world ID contains a path traversal");
        }

        if (instances.has(instanceId)) {
          throw new JsonAPIError(
            Status.Conflict,
            body.edit_mode
              ? "An instance with this ID already exists! (Is an edit instance already running?)"
              : "An instance with this ID already exists!",
          );
        }

        const instance = createInstance(instanceId, worldId, worldVariant, {
          startedBy: body.started_by,
          editMode: body.edit_mode ?? false,
          worldRevision: body.revision,
        });
        instances.set(instanceId, instance);

        return instance.info();
      },
    ),
  );

  const RunningInstanceByIdSchema = z
    .string()
    .transform(id => instances.get(id))
    .refine((instance): instance is RunningInstance => instance !== undefined, {
      message: "There is no running instance with the given ID.",
      params: { status: Status.NotFound, throwEarly: true },
    });

  router.get(
    "/api/v1/instance/:instance",
    typedJsonHandler(
      {
        params: z.object({ instance: RunningInstanceByIdSchema }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { params }) => params.instance.info(),
    ),
  );

  router.delete(
    "/api/v1/instance/:instance",
    bearerTokenAuth(APP_CONFIG.coordAuthSecret),
    typedJsonHandler(
      {
        params: z.object({ instance: RunningInstanceByIdSchema }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { params }) => {
        instances.delete(params.instance.instanceId);
        params.instance.shutdown();
        return params.instance.info();
      },
    ),
  );

  router.post(
    "/api/v1/restart-instance/:instance",
    bearerTokenAuth(APP_CONFIG.coordAuthSecret),
    typedJsonHandler(
      {
        params: z.object({ instance: RunningInstanceByIdSchema }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { params }) => {
        params.instance.restart();
        return params.instance.info();
      },
    ),
  );
};
