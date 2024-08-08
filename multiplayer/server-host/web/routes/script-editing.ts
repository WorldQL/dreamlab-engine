import { Router, Status } from "../../deps/oak.ts";
import { z } from "@dreamlab/vendor/zod.ts";

import * as path from "jsr:@std/path@1";
import * as fs from "jsr:@std/fs@1";
import { contentType } from "https://deno.land/std@0.224.0/media_types/mod.ts";

import { GameInstance } from "../../instance.ts";
import { JsonAPIError, typedJsonHandler } from "../util/api.ts";

export const serveScriptEditingAPI = (router: Router) => {
  const instances = GameInstance.INSTANCES;

  const EditModeInstanceSchema = z
    .string()
    .transform(id => instances.get(id))
    .refine((instance): instance is GameInstance => instance !== undefined, {
      message: "An instance with the given ID does not exist",
      params: { status: Status.NotFound, throwEarly: true },
    })
    .refine(instance => instance.info.editMode, {
      message: "The instance is not in edit mode",
      params: { status: Status.Forbidden, throwEarly: true },
    });

  router.get("/api/v1/edit/:instance_id/files/:path*", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = instances.get(instanceId);
    if (instance === undefined)
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");

    // add auth?

    const worldFolder = instance.info.worldDirectory;

    const filePath = ctx.params.path;
    if (filePath === undefined || filePath.length === 0) {
      const files: string[] = [];
      for await (const entry of fs.expandGlob("**/*", {
        root: worldFolder,
        exclude: ["node_modules", ".git", "_dist", "*-esbuild.js"],
      })) {
        if (entry.isFile) {
          files.push(path.relative(worldFolder, entry.path));
        }
      }
      ctx.response.body = { files };

      return;
    }

    const computedPath = path.join(worldFolder, filePath);
    const relativePath = path.relative(worldFolder, computedPath);
    if (relativePath.startsWith("..")) {
      throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
    }

    try {
      await ctx.send({
        root: worldFolder,
        path: relativePath,
        hidden: true,
        contentTypes: {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
          ".gif": "image/gif",
          ".ico": "image/vnd.microsoft.icon",
          ".svg": "image/svg+xml",
        },
      });
      const type = ctx.response.type;
      if (type && contentType(type)?.startsWith("image/")) {
        ctx.response.headers.set("Content-Disposition", "inline");
      }
      if (type === ".ts") {
        ctx.response.type = "text/plain";
        ctx.response.headers.set("Content-Disposition", "inline");
      }
      if (!type) {
        ctx.response.type = "application/octet-stream";
      }
    } catch {
      ctx.response.type = "text/plain";
      ctx.response.status = Status.NotFound;
      ctx.response.body = "Not Found";
    }
  });

  // put multiple files
  router.put(
    "/api/v1/edit/:instance/files-multiple",
    typedJsonHandler(
      {
        params: z.object({
          instance: EditModeInstanceSchema,
        }),
        body: z.array(
          z.object({
            path: z.string(),
            content: z.string(),
          }),
        ),
        response: z.object({ success: z.boolean() }),
      },
      async (ctx, { params, body }) => {
        const instance = params.instance;
        const worldFolder = instance.info.worldDirectory;

        for (const file of body) {
          const computedPath = path.join(worldFolder, file.path);
          const relativePath = path.relative(worldFolder, computedPath);
          if (relativePath.startsWith("..")) {
            throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
          }

          await fs.ensureDir(path.dirname(computedPath));
          await Deno.writeTextFile(computedPath, file.content);
        }

        if (ctx.request.url.searchParams.get("no_restart") !== "true") {
          instance.restart();
        }

        return { success: true };
      },
    ),
  );

  // put file
  router.put(
    "/api/v1/edit/:instance/files/:path*",
    typedJsonHandler(
      {
        params: z.object({
          instance: EditModeInstanceSchema,
          path: z.string().refine(s => !!s, {
            message: "An invalid path was provided!",
            params: { status: Status.BadRequest, throwEarly: true },
          }),
        }),
        query: z.object({
          no_restart: z.coerce.boolean().default(false),
        }),
        response: z.object({ success: z.boolean() }),
      },
      async (ctx, { query, params }) => {
        const instance = params.instance;
        const worldFolder = instance.info.worldDirectory;

        const computedPath = path.join(worldFolder, params.path);
        const relativePath = path.relative(worldFolder, computedPath);
        if (relativePath.startsWith("..")) {
          // reject path traversal outside of world dir
          throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
        }

        await fs.ensureDir(path.dirname(computedPath));

        const file = await Deno.open(computedPath, {
          write: true,
          truncate: true,
          create: true,
          createNew: false,
          append: false,
        });
        await ctx.request.body.stream?.pipeTo(file.writable);

        if (!query.no_restart) {
          instance.restart();
        }

        return { success: true };
      },
    ),
  );

  // delete file
  router.delete(
    "/api/v1/edit/:instance/files/:path*",
    typedJsonHandler(
      {
        params: z.object({
          instance: EditModeInstanceSchema,
          path: z.string().refine(s => !!s, {
            message: "An invalid path was provided!",
            params: { status: Status.BadRequest, throwEarly: true },
          }),
        }),
        query: z.object({
          no_restart: z.coerce.boolean().default(false),
        }),
        response: z.object({ success: z.boolean() }),
      },
      async (_ctx, { query, params }) => {
        const instance = params.instance;
        const worldFolder = instance.info.worldDirectory;

        const computedPath = path.join(worldFolder, params.path);
        const relativePath = path.relative(worldFolder, computedPath);
        if (relativePath.startsWith("..")) {
          throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
        }

        await Deno.remove(computedPath, { recursive: true });

        if (!query.no_restart) {
          instance.restart();
        }

        return { success: true };
      },
    ),
  );

  // patch file path
  router.patch("/api/v1/edit/:instance_id/files/:path*", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = instances.get(instanceId);
    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const BodySchema = z.object({
      newPath: z.string(),
    });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      throw new JsonAPIError(Status.BadRequest, err.toString());
    }

    const worldFolder = instance.info.worldDirectory;

    const oldFilePath = ctx.params.path;
    if (oldFilePath === undefined) {
      throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
    }

    const oldComputedPath = path.join(worldFolder, oldFilePath);
    const oldRelativePath = path.relative(worldFolder, oldComputedPath);
    if (oldRelativePath.startsWith("..")) {
      throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
    }

    const newComputedPath = path.join(worldFolder, body.newPath);
    const newRelativePath = path.relative(worldFolder, newComputedPath);
    if (newRelativePath.startsWith("..")) {
      throw new JsonAPIError(Status.BadRequest, "An invalid new path was provided!");
    }

    await fs.ensureDir(path.dirname(newComputedPath));
    await Deno.rename(oldComputedPath, newComputedPath);

    ctx.response.body = { success: true };

    if (ctx.request.url.searchParams.get("no_restart") !== "true") {
      instance.restart();
    }
  });

  // clear logs
  router.post(
    "/api/v1/edit/:instance/clear-logs",
    typedJsonHandler(
      {
        params: z.object({
          instance: EditModeInstanceSchema,
        }),
        response: z.object({ success: z.boolean() }),
      },
      async (_ctx, { params }) => {
        const instance = params.instance;

        // TODO(Charlotte): somehow broadcast a 'logs were cleared' message
        // so that all log streamers receive a 'clear logs' instruction
        // (requires rework of LogSubscription?)
        instance.logs.entries = [];

        return { success: true };
      },
    ),
  );
};
