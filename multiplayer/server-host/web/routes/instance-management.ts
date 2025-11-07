import * as z from "@dreamlab/vendor/zod.ts";
import { Router, Status } from "@oak/oak";
import * as path from "@std/path";
import { generate as generateUUIDv5 } from "@std/uuid/v5";

import { SceneSchema } from "@dreamlab/scene";
import { JsonAPIError, typedJsonHandler } from "../../../common-host/web-util/api.ts";
import type { WorkerIPCMessage } from "../../../server-common/ipc.ts";
import { CONFIG } from "../../config.ts";
import { deleteRoomsForInstance } from "../../instance-collector.ts";
import { createInstance, dumpSceneDefinition, GameInstance } from "../../instance.ts";
import { bearerTokenAuth } from "../util/auth.ts";
import { instanceInfo, InstanceInfoSchema } from "../util/instance-info.ts";

export const serveInstanceManagementAPI = (router: Router) => {
  router.get(
    "/api/v1/instances",
    typedJsonHandler(
      {
        query: z.object({ world: z.string().optional() }),
        response: z.record(z.string(), InstanceInfoSchema),
      },
      async (ctx, { query }) => {
        const hasAuth =
          ctx.request.headers.get("Authorization") ===
          `Bearer ${CONFIG.MULTIPLAYER_AUTH_TOKEN}`;

        let instances = [...GameInstance.INSTANCES.entries()];

        if (query.world)
          instances = instances.filter(
            ([_id, instance]) => instance.info.worldId === query.world,
          );

        if (!hasAuth)
          instances = instances.filter(([_id, instance]) => !(instance.info.editMode ?? false));

        return Object.fromEntries(
          instances.map(([id, instance]) => [id, instanceInfo(instance)]),
        );
      },
    ),
  );

  router.post(
    "/api/v1/start-play-world",
    typedJsonHandler(
      {
        body: z.object({
          world_id: z.string(),
        }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { body }) => {
        const worldId = body.world_id;
        const instanceId = crypto.randomUUID();

        if (worldId.includes("../")) {
          throw new JsonAPIError(Status.BadRequest, "The world ID contians a path traversal");
        }

        if (GameInstance.INSTANCES.has(instanceId)) {
          throw new JsonAPIError(Status.Conflict, "An instance with this ID already exists!");
        }

        const instance = createInstance({
          instanceId,
          worldId,
          worldDirectory: `${CONFIG.WORLDS_DIRECTORY}/${worldId}`,
        });

        return instanceInfo(instance);
      },
    ),
  );

  router.put(
    "/api/v1/instances",
    bearerTokenAuth(CONFIG.MULTIPLAYER_AUTH_TOKEN),
    typedJsonHandler(
      {
        body: z.object({
          world_id: z.string(),
          started_by: z.string().optional(),
          edit_mode: z.boolean().optional(),
          nil: z.boolean().optional(),
          force_random_id: z.boolean().optional(),
          revision: z.string().optional(),
          git_id: z.string().optional(),
        }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { body }) => {
        // arbitrary
        const DREAMLAB_EDIT_NAMESPACE = "b2d25565-3f12-4acd-90bb-7883eee613fe";

        const instanceId =
          body.nil && CONFIG.IS_DEV
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
          gitId: body.git_id,
          worldDirectory: `${CONFIG.WORLDS_DIRECTORY}/${worldId}`,
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
    .pipe(
      z.transform((instance, ctx) => {
        if (instance === undefined) {
          ctx.issues.push({
            input: instance,
            message: "There is no running instance with the given ID.",
            code: "custom",
            params: { status: Status.NotFound, throwEarly: true },
          });

          return z.NEVER;
        }

        return instance;
      }),
    );

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
    bearerTokenAuth(CONFIG.MULTIPLAYER_AUTH_TOKEN),
    typedJsonHandler(
      {
        params: z.object({ instance: RunningInstanceByIdSchema }),
        response: InstanceInfoSchema,
      },
      async (_ctx, { params }) => {
        const instanceId = params.instance.info.instanceId;

        GameInstance.INSTANCES.delete(instanceId);
        params.instance.shutdown();

        if (!GameInstance.INSTANCES.get(instanceId)?.info.editMode)
          deleteRoomsForInstance(instanceId);

        return instanceInfo(params.instance);
      },
    ),
  );

  router.post(
    "/api/v1/restart-instance/:instance",
    bearerTokenAuth(CONFIG.MULTIPLAYER_AUTH_TOKEN),
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
        if (!instance.session)
          throw new Error("The given instance is not currently running a session.");

        await instance.session.saveScene();

        return { success: true };
      },
    ),
  );

  router.post(
    "/api/v1/rename-behavior-script/:instance",
    typedJsonHandler(
      {
        params: z.object({ instance: EditModeInstanceSchema }),
        response: z.object({ success: z.boolean() }),
        body: z.object({ oldUri: z.string(), newUri: z.string() }),
      },
      async (_ctx, { params, body }) => {
        const { instance } = params;
        if (!instance.session)
          throw new Error("The given instance is not currently running a session.");

        const packet = {
          t: "CustomMessage",
          channel: "@editor/rename-behavior",
          data: { oldUri: body.oldUri, newUri: body.newUri },
        } as const;

        instance.session.broadcastPacket(packet);
        instance.session.ipc.send({
          op: "IncomingPacket",
          from: "server",
          packet,
        });

        return { success: true };
      },
    ),
  );

  router.post(
    "/api/v1/instance/:instance/call",
    typedJsonHandler(
      {
        params: z.object({ instance: RunningInstanceByIdSchema }),
        body: z.object({ identifier: z.string(), params: z.array(z.unknown()) }),
        response: z.discriminatedUnion("status", [
          z.object({ status: z.literal("ok"), result: z.unknown() }),
          z.object({ status: z.literal("error"), error: z.unknown() }),
        ]),
      },
      async (_ctx, { params: { instance }, body }) => {
        const session = instance.playSession ?? instance.session;
        if (!session) throw new Error("The given instance is not currently running a session.");

        const callId = crypto.randomUUID();

        let cleanedUp = false;
        const cleanup = () => {
          if (cleanedUp) return;
          // @ts-expect-error funny polymorphic listener
          session.ipc.removeMessageListener(responseListener);
          cleanedUp = true;
        };
        const responsePromise = Promise.withResolvers<unknown>();
        const responseListener = (
          message: WorkerIPCMessage & { op: "HttpAPIResponse" | "HttpAPIError" },
        ) => {
          if (message.callId !== callId) return;
          switch (message.op) {
            case "HttpAPIResponse": {
              responsePromise.resolve(message.result);
              cleanup();
              break;
            }
            case "HttpAPIError": {
              responsePromise.reject(message.error);
              cleanup();
              break;
            }
          }
        };
        session.ipc.addMessageListener("HttpAPIResponse", responseListener);
        session.ipc.addMessageListener("HttpAPIError", responseListener);
        session.ipc.send({
          op: "HttpAPICall",
          callId,
          route: body.identifier,
          params: body.params,
        });

        try {
          const sleep = new Promise<void>((_, rej) => setTimeout(() => rej("timed out"), 5000));
          const res = await Promise.race([responsePromise.promise, sleep]);
          return { status: "ok", result: res } as const;
        } catch (err) {
          return { status: "error", error: err } as const;
        }
      },
    ),
  );
};
