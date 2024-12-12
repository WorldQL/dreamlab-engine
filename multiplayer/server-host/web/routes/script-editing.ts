import { z } from "@dreamlab/vendor/zod.ts";
import { Router, Status } from "../../deps/oak.ts";

import { contentType } from "https://deno.land/std@0.224.0/media_types/mod.ts";
import * as fs from "jsr:@std/fs@1";
import * as path from "jsr:@std/path@1";

import { PlayPacket } from "@dreamlab/proto/play.ts";
import { ProjectSchema, SceneDescEntity } from "@dreamlab/scene";
import { fileIsProbablyBehaviorScript } from "../../../../build-system/build-world.ts";
import { CONFIG } from "../../config.ts";
import { GameInstance } from "../../instance.ts";
import { sortPaths } from "../../util/sort-paths.ts";
import { buildWorld } from "../../world-build.ts";
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
      const entries = fs.expandGlob("**/*", {
        root: worldFolder,
        exclude: ["node_modules", ".git", "_dist", "_dist_play", "*-esbuild.js"],
      });

      for await (const entry of entries) {
        if (entry.isFile) {
          files.push(path.relative(worldFolder, entry.path));
        }
      }

      ctx.response.body = { files: sortPaths(files) };

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
      async (_ctx, { params, body }) => {
        const instance = params.instance;
        const worldFolder = instance.info.worldDirectory;

        const packets: PlayPacket<"ScriptEdited", "server">[] = [];

        for (const file of body) {
          const computedPath = path.join(worldFolder, file.path);
          const relativePath = path.relative(worldFolder, computedPath);
          if (relativePath.startsWith("..")) {
            throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
          }

          await fs.ensureDir(path.dirname(computedPath));
          await Deno.writeTextFile(computedPath, file.content);

          const isBehavior = await fileIsProbablyBehaviorScript(computedPath);
          packets.push({
            t: "ScriptEdited",
            script_location: relativePath,
            behavior_script_id: isBehavior
              ? `res://${relativePath.replace(/\.tsx?$/, ".js")}`
              : undefined,
          });

          if (file.path === "project.json") {
            // instance.session?.ipc.send({ op: "ReloadEditScene" });
            // This was easy to shoot yourself in the foot with.
            // TODO: Properly address the rename file problem server-side or something.
          }
        }

        await buildWorld(instance.info.worldId, instance.info.worldDirectory, "_dist");
        for (const packet of packets) instance.session?.broadcastPacket(packet);

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
        response: z.object({ success: z.boolean() }),
      },
      async (ctx, { params }) => {
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

        await buildWorld(instance.info.worldId, instance.info.worldDirectory, "_dist");
        const isBehavior = await fileIsProbablyBehaviorScript(computedPath);
        instance.session?.broadcastPacket({
          t: "ScriptEdited",
          script_location: relativePath,
          behavior_script_id: isBehavior
            ? `res://${relativePath.replace(/\.tsx?$/, ".js")}`
            : undefined,
        });

        if (params.path === "project.json") {
          instance.session?.ipc.send({ op: "ReloadEditScene" });
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
        response: z.object({ success: z.boolean() }),
      },
      async (_ctx, { params }) => {
        const instance = params.instance;
        const worldFolder = instance.info.worldDirectory;

        const computedPath = path.join(worldFolder, params.path);
        const relativePath = path.relative(worldFolder, computedPath);
        if (relativePath.startsWith("..")) {
          throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
        }

        await Deno.remove(computedPath, { recursive: true });

        instance.session?.broadcastPacket({
          t: "ScriptEdited",
          script_location: relativePath,
          behavior_script_id: undefined,
        });

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

    // TODO: rebuild world and send scriptedited packet

    ctx.response.body = { success: true };
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

  router.get("/api/v1/edit/:instance_id/edited-files", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = instances.get(instanceId);

    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    const worldFolder = instance.info.worldDirectory;
    const filesWithVersion = [];

    for await (const entry of fs.expandGlob("**/*", {
      root: worldFolder,
      exclude: ["node_modules", ".git", "_dist", "_dist_play", "*-esbuild.js"],
    })) {
      if (entry.isFile) {
        const relativePath = path.relative(worldFolder, entry.path);
        const stats = await Deno.stat(entry.path);
        const lastModified = stats.mtime?.getTime() || Date.now();

        filesWithVersion.push({
          filePath: relativePath,
          version: lastModified,
        });
      }
    }

    ctx.response.body = { files: filesWithVersion };
  });

  router.post(
    "/api/v1/edit/:instance/import-project",
    typedJsonHandler(
      {
        params: z.object({
          instance: EditModeInstanceSchema,
        }),
        body: z.object({ sourceProject: z.string() }),
        response: z.object({ success: z.boolean() }),
      },
      async (ctx, { params, body }) => {
        const { instance } = params;

        const targetProjectDir = instance.info.worldDirectory;
        const sourceProjectDir = await Deno.makeTempDir({ prefix: "dreamlab-import" });

        const cloneProcess = new Deno.Command("git", {
          args: ["clone", `${CONFIG.gitBase}/${body.sourceProject}.git`, sourceProjectDir],
        }).spawn();
        const cloneStatus = await cloneProcess.status;
        if (!cloneStatus.success)
          throw new JsonAPIError(Status.InternalServerError, "Failed to clone sourceProject");

        const sourceProjectName = sourceProjectDir.substring(
          sourceProjectDir.lastIndexOf("/") + 1,
        );

        const importedDir = path.join(targetProjectDir, "src", "imported", sourceProjectName);
        await fs.ensureDir(path.dirname(importedDir));
        await fs.copy(sourceProjectDir, importedDir);

        const importedProjectJson = await Deno.readTextFile(
          path.join(importedDir, "project.json"),
        );
        const importedProject = ProjectSchema.parse(JSON.parse(importedProjectJson));
        const importedScene = importedProject.scenes.main;
        if (typeof importedScene === "string") {
          // FIXME
          throw new Error("Can't import from externalized scene JSON!");
        }

        const importedScriptLocation = `res://src/imported/${sourceProjectName}`;
        const rewriteScriptLocations = (e: SceneDescEntity): void => {
          for (const behavior of e.behaviors ?? []) {
            behavior.script = behavior.script.replace(/^res:\/\//, importedScriptLocation);
          }
          if (e.children) e.children.forEach(rewriteScriptLocations);
        };

        for (const prefabEntity of importedScene.prefabs) {
          rewriteScriptLocations(prefabEntity);
          instance.session?.ipc.send({ op: "ImportEditPrefab", entity: prefabEntity });
        }

        await Deno.remove(path.join(importedDir, "project.json"));

        return { success: true };
      },
    ),
  );
};
