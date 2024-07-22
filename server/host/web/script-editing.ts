import { Router, Status } from "oak";
import { z } from "zod";

import { getWorldPath } from "../config.ts";
import { RunningInstance } from "../instance/mod.ts";

import { jsonError, typedJsonHandler } from "./util.ts";

import * as path from "@std/path";
import * as fs from "@std/fs";
import { contentType } from "https://deno.land/std@0.224.0/media_types/mod.ts";
import { JsonAPIError } from "./util.ts";
import * as log from "../util/log.ts";
import { bundle, transpile } from "@deno/emit";
import * as esbuild from "https://deno.land/x/esbuild@v0.23.0/mod.js";

export const scriptEditRoutes = (router: Router, instances: Map<string, RunningInstance>) => {
  const EditModeInstanceSchema = z
    .string()
    .transform(id => instances.get(id))
    .refine((instance): instance is RunningInstance => instance !== undefined, {
      message: "An instance with the given ID does not exist",
      params: { status: Status.NotFound, throwEarly: true },
    })
    .refine(instance => instance.editMode, {
      message: "The instance is not in edit mode",
      params: { status: Status.Forbidden, throwEarly: true },
    });

  // #region Get file
  router.get("/api/v1/edit/:instance_id/files/:path*", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = instances.get(instanceId);
    if (instance === undefined) {
      jsonError(ctx, Status.NotFound, "An instance with the given ID does not exist");
      return;
    }

    // add auth?

    const transpileOption = ctx.request.url.searchParams.get("transpile") === "true";

    const worldFolder = path.join(
      Deno.cwd(),
      "runtime",
      "worlds",
      getWorldPath(instance.worldId, instance.worldVariant),
    );

    const filePath = ctx.params.path;
    if (filePath === undefined || filePath.length === 0) {
      const files: string[] = [];
      for await (const entry of fs.expandGlob("**/*", {
        root: worldFolder,
        exclude: [
          "node_modules",
          ".git",
          `client.${instance.worldVariant}.bundled.js`,
          `client.${instance.worldVariant}.bundled.js.map`,
        ],
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
      jsonError(ctx, Status.BadRequest, "An invalid path was provided!");
      return;
    }

    if (!(await fs.exists(computedPath))) {
      ctx.response.type = "text/plain";
      ctx.response.status = Status.NotFound;
      ctx.response.body = "Not Found";
      return;
    }

    if (!transpileOption) {
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
    } else {
      if (computedPath.split(".").pop() !== "ts" || computedPath.split(".").pop() !== "tsx" ) {
        ctx.response.type = "text/plain";
        ctx.response.status = Status.BadRequest;
        ctx.response.body = "Transpilation only supported for TypeScript files.";
        return;
      }

      ctx.response.type = "application/javascript";
      ctx.response.status = Status.OK;

      const suffix = "-esbuild.js";
      await esbuild.build({
        entryPoints: [computedPath],
        bundle: true,
        outfile: computedPath + suffix,
        format: "esm",
        external: ["@dreamlab/engine"],
        sourcemap: "inline",
        keepNames: true,
        // jsx: "automatic",
        platform: "browser",
        target: "es2022",
      });
      await ctx.send({
        root: worldFolder,
        path: relativePath + suffix,
      });
    }
  });

  // #region Put multiple files
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
        const worldFolder = path.join(
          Deno.cwd(),
          "runtime",
          "worlds",
          getWorldPath(instance.worldId, instance.worldVariant),
        );

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

  // #region Put file
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
        const worldFolder = path.join(
          Deno.cwd(),
          "runtime",
          "worlds",
          getWorldPath(instance.worldId, instance.worldVariant),
        );

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
        await ctx.request.body({ type: "stream" }).value.pipeTo(file.writable);

        if (!query.no_restart) {
          instance.restart();
        }

        return { success: true };
      },
    ),
  );

  // #region Delete file
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
        const worldFolder = path.join(
          Deno.cwd(),
          "runtime",
          "worlds",
          getWorldPath(instance.worldId, instance.worldVariant),
        );

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

  // #region Patch File path
  router.patch("/api/v1/edit/:instance_id/files/:path*", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = instances.get(instanceId);
    if (instance === undefined) {
      jsonError(ctx, Status.NotFound, "An instance with the given ID does not exist");
      return;
    }

    if (!instance.editMode) {
      jsonError(ctx, Status.Forbidden, "The instance is not in edit mode");
      return;
    }

    const BodySchema = z.object({
      newPath: z.string(),
    });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body({ type: "json" }).value);
    } catch (err) {
      jsonError(ctx, Status.BadRequest, err.toString());
      return;
    }

    const worldFolder = path.join(
      Deno.cwd(),
      "runtime",
      "worlds",
      getWorldPath(instance.worldId, instance.worldVariant),
    );

    const oldFilePath = ctx.params.path;
    if (oldFilePath === undefined) {
      jsonError(ctx, Status.BadRequest, "An invalid path was provided!");
      return;
    }

    const oldComputedPath = path.join(worldFolder, oldFilePath);
    const oldRelativePath = path.relative(worldFolder, oldComputedPath);
    if (oldRelativePath.startsWith("..")) {
      jsonError(ctx, Status.BadRequest, "An invalid path was provided!");
      return;
    }

    const newComputedPath = path.join(worldFolder, body.newPath);
    const newRelativePath = path.relative(worldFolder, newComputedPath);
    if (newRelativePath.startsWith("..")) {
      jsonError(ctx, Status.BadRequest, "An invalid new path was provided!");
      return;
    }

    await fs.ensureDir(path.dirname(newComputedPath));
    await Deno.rename(oldComputedPath, newComputedPath);

    ctx.response.body = { success: true };

    if (ctx.request.url.searchParams.get("no_restart") !== "true") {
      instance.restart();
    }
  });

  // #region Clear logs
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
