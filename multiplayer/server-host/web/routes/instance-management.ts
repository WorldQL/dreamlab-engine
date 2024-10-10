import { z } from "@dreamlab/vendor/zod.ts";
import * as path from "jsr:@std/path@1";
import { generate as generateUUIDv5 } from "jsr:@std/uuid@1/v5";
import { Router, Status } from "../../deps/oak.ts";

import { SceneSchema } from "@dreamlab/scene";
import { CONFIG } from "../../config.ts";
import { createInstance, dumpSceneDefinition, GameInstance } from "../../instance.ts";
import { JsonAPIError, typedJsonHandler } from "../util/api.ts";
import { bearerTokenAuth } from "../util/auth.ts";
import { instanceInfo, InstanceInfoSchema } from "../util/instance-info.ts";

export const serveInstanceManagementAPI = (router: Router) => {
  router.get(
    "/api/v1/instances",
    bearerTokenAuth(CONFIG.coordAuthSecret),
    typedJsonHandler(
      {
        query: z.object({ world: z.string().optional() }),
        response: z.record(z.string(), InstanceInfoSchema),
      },
      async (_ctx, { query }) => {
        return Object.fromEntries(
          [...GameInstance.INSTANCES.entries()]
            .filter(([_id, instance]) =>
              query.world ? instance.info.worldId === query.world : true,
            )
            .map(([id, instance]) => [id, instanceInfo(instance)]),
        );
      },
    ),
  );

  router.put(
    "/api/v1/instances",
    bearerTokenAuth(CONFIG.coordAuthSecret),
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
        // arbitrary
        const DREAMLAB_EDIT_NAMESPACE = "b2d25565-3f12-4acd-90bb-7883eee613fe";

        const instanceId =
          body.nil && CONFIG.isDev
            ? "00000000-0000-0000-0000-000000000000"
            : body.edit_mode && !body.force_random_id
              ? await generateUUIDv5(
                  DREAMLAB_EDIT_NAMESPACE,
                  new TextEncoder().encode(body.world_id),
                )
              : crypto.randomUUID();

        const worldId = body.world_id;

        if (worldId.includes("../")) {
          throw new JsonAPIError(Status.BadRequest, "The world ID contains a path traversal");
        }

        if (GameInstance.INSTANCES.has(instanceId)) {
          throw new JsonAPIError(
            Status.Conflict,
            body.edit_mode
              ? "An instance with this ID already exists! (Is an edit instance already running?)"
              : "An instance with this ID already exists!",
          );
        }

        const instance = createInstance({
          instanceId: instanceId,
          worldId,
          worldDirectory: `${Deno.cwd()}/worlds/${worldId}`,
          startedBy: body.started_by,
          editMode: body.edit_mode,
        });

        return instanceInfo(instance);
      },
    ),
  );

  const RunningInstanceByIdSchema = z
    .string()
    .transform(id => GameInstance.INSTANCES.get(id))
    .refine((instance): instance is GameInstance => instance !== undefined, {
      message: "There is no running instance with the given ID.",
      params: { status: Status.NotFound, throwEarly: true },
    });

  const EditModeInstanceSchema = RunningInstanceByIdSchema.refine(
    instance => instance.info.editMode,
    {
      message: "The instance is not in edit mode",
      params: { status: Status.Forbidden, throwEarly: true },
    },
  );

  router.get(
    "/api/v1/instance/:instance",
    typedJsonHandler(
      {
        params: z.object({ instance: RunningInstanceByIdSchema }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { params }) => instanceInfo(params.instance),
    ),
  );

  router.delete(
    "/api/v1/instance/:instance",
    bearerTokenAuth(CONFIG.coordAuthSecret),
    typedJsonHandler(
      {
        params: z.object({ instance: RunningInstanceByIdSchema }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { params }) => {
        GameInstance.INSTANCES.delete(params.instance.info.instanceId);
        params.instance.shutdown();
        return instanceInfo(params.instance);
      },
    ),
  );

  router.post(
    "/api/v1/restart-instance/:instance",
    bearerTokenAuth(CONFIG.coordAuthSecret),
    typedJsonHandler(
      {
        params: z.object({ instance: RunningInstanceByIdSchema }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { params }) => {
        params.instance.restart();
        return instanceInfo(params.instance);
      },
    ),
  );

  router.post(
    "/api/v1/stop-play-session/:instance",
    typedJsonHandler(
      {
        params: z.object({ instance: EditModeInstanceSchema }),
        response: z.object({ success: z.boolean() }),
      },
      async (_ctx, { params: { instance } }) => {
        instance.playSession?.shutdown();
        instance.playSession = undefined;
        instance.sendPlaySessionState();

        return { success: true };
      },
    ),
  );

  router.post(
    "/api/v1/dump-edit-session/:instance",
    typedJsonHandler(
      {
        params: z.object({ instance: EditModeInstanceSchema }),
        response: z.object({ scene: SceneSchema }),
      },
      async (_ctx, { params }) => {
        return { scene: await dumpSceneDefinition(params.instance) };
      },
    ),
  );

  router.post(
    "/api/v1/save-edit-session/:instance",
    typedJsonHandler(
      {
        params: z.object({ instance: EditModeInstanceSchema }),
        response: z.object({ success: z.boolean() }),
      },
      async (_ctx, { params }) => {
        const instance = params.instance;
        const scene = await dumpSceneDefinition(instance);

        const projectJsonFile = path.join(instance.info.worldDirectory, "project.json");
        const projectDesc = JSON.parse(await Deno.readTextFile(projectJsonFile));
        projectDesc.scenes = { ...(projectDesc.scenes ?? {}), main: scene };
        await Deno.writeTextFile(projectJsonFile, JSON.stringify(projectDesc, undefined, 2));

        return { success: true };
      },
    ),
  );
};
