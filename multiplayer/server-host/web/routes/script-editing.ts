import { z } from "@dreamlab/vendor/zod.ts";
import { Router, Status } from "@oak/oak";

import * as fs from "@std/fs";
import * as path from "@std/path";
import { contentType } from "https://deno.land/std@0.224.0/media_types/mod.ts";

import { Entity } from "@dreamlab/engine";
import { PlayPacket } from "@dreamlab/proto/play.ts";
import { ProjectSchema, SceneDescEntity } from "@dreamlab/scene";
import { fileIsProbablyBehaviorScript } from "../../../../build-system/build-world.ts";
import { JsonAPIError, typedJsonHandler } from "../../../common-host/web-util/api.ts";
import { buildWorld } from "../../../server-common/world-build.ts";
import { CONFIG } from "../../config.ts";
import { GameInstance } from "../../instance.ts";
import { sortPaths } from "../../util/sort-paths.ts";

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
        exclude: ["node_modules", ".git", "_dist", "_dist_*", "*-esbuild.js"],
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
          isFromFileSystem: false,
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

    await buildWorld(instance.info.worldId, instance.info.worldDirectory, "_dist");
    const isBehavior = await fileIsProbablyBehaviorScript(newComputedPath);
    instance.session?.broadcastPacket({
      t: "ScriptEdited",
      script_location: newRelativePath,
      behavior_script_id: isBehavior
        ? `res://${newRelativePath.replace(/\.tsx?$/, ".js")}`
        : undefined,
      isFromFileSystem: false,
    });

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

  //TODO: double check implementation and move to source-control.ts
  router.post(
    "/api/v1/edit/:instance/git-reset-hard",
    typedJsonHandler(
      {
        params: z.object({
          instance: EditModeInstanceSchema,
        }),
        response: z.object({ success: z.boolean() }),
      },
      async (_ctx, { params }) => {
        const { instance } = params;
        const cwd = instance.info.worldDirectory;

        const gitFetch = new Deno.Command("git", {
          args: ["fetch", "origin", "main"],
          cwd,
        }).spawn();
        const fetchStatus = await gitFetch.status;
        if (!fetchStatus.success) {
          throw new JsonAPIError(
            Status.InternalServerError,
            "Failed to run `git fetch origin main`",
          );
        }

        const gitResetCommand = new Deno.Command("git", {
          args: ["reset", "--hard", "origin/main"],
          cwd,
        });
        const resetProcess = gitResetCommand.spawn();
        const resetStatus = await resetProcess.status;
        if (!resetStatus.success) {
          throw new JsonAPIError(
            Status.InternalServerError,
            "Failed to run `git reset --hard origin/main`",
          );
        }

        // clean untracked files ?
        const gitCleanCommand = new Deno.Command("git", {
          args: ["clean", "-fd"],
          cwd,
        });
        const cleanProc = gitCleanCommand.spawn();
        const cleanStatus = await cleanProc.status;
        if (!cleanStatus.success) {
          throw new JsonAPIError(Status.InternalServerError, "Failed to run `git clean -fd`");
        }

        return { success: true };
      },
    ),
  );

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
          args: [
            "clone",
            `${CONFIG.DISTRIBUTION_PUBLIC_URL}/${body.sourceProject}.git`,
            sourceProjectDir,
          ],
        }).spawn();
        const cloneStatus = await cloneProcess.status;
        if (!cloneStatus.success)
          throw new JsonAPIError(Status.InternalServerError, "Failed to clone sourceProject");

        const sourceProjectName = body.sourceProject.substring(
          body.sourceProject.lastIndexOf("/") + 1,
        );

        const importedDir = path.join(targetProjectDir, "src", "imported", sourceProjectName);
        await fs.ensureDir(path.dirname(importedDir));
        try {
          await Deno.remove(importedDir, { recursive: true });
        } catch (err) {
          if (err instanceof Deno.errors.NotFound) {
            // ignore
          } else {
            throw err;
          }
        }
        await fs.copy(sourceProjectDir, importedDir);
        await Deno.remove(path.join(importedDir, ".git"), { recursive: true });

        const importedProjectJson = await Deno.readTextFile(
          path.join(importedDir, "project.json"),
        );
        const importedProject = ProjectSchema.parse(JSON.parse(importedProjectJson));
        const importedScene = importedProject.scenes.main;
        if (typeof importedScene === "string") {
          // FIXME
          throw new Error("Can't import from externalized scene JSON!");
        }

        await buildWorld(instance.info.worldId, instance.info.worldDirectory, "_dist");

        const importedScripts = fs.expandGlob(path.join(importedDir, "src/**/*.ts"));
        const scriptEditPackets: PlayPacket<"ScriptEdited", "server">[] = [];
        for await (const script of importedScripts) {
          scriptEditPackets.push({
            t: "ScriptEdited",
            script_location: path.relative(instance.info.worldDirectory, script.path),
          });
        }
        for (const packet of scriptEditPackets) {
          instance.session?.broadcastPacket(packet);
        }

        const importedScriptLocation = `res://src/imported/${sourceProjectName}/`;
        const rewriteScriptLocations = (e: SceneDescEntity): void => {
          for (const behavior of e.behaviors ?? []) {
            behavior.script = behavior.script.replace(/^res:\/\//, importedScriptLocation);
          }
          e.children?.forEach(rewriteScriptLocations);
        };
        importedScene.prefabs.forEach(rewriteScriptLocations);

        const refMap: Record<string, string> = {};
        const generateNewRef = (e: SceneDescEntity): void => {
          refMap[e.ref] = Entity.createRef();
          e.children?.forEach(generateNewRef);
        };
        importedScene.prefabs.forEach(generateNewRef);

        const replaceRefs = (e: SceneDescEntity): void => {
          e.ref = refMap[e.ref] ?? e.ref;

          // rewrite behavior values
          for (const behavior of e.behaviors ?? []) {
            if (!behavior.values) continue;
            for (const key of Object.keys(behavior.values)) {
              const value = behavior.values[key];
              if (typeof value !== "string") continue;
              const remapped = refMap[value];
              if (!remapped) continue;
              behavior.values[key] = remapped;
            }
          }

          e.children?.forEach(replaceRefs);
        };
        importedScene.prefabs.forEach(replaceRefs);

        importedScene.prefabs.forEach(entity => {
          instance.session?.ipc.send({ op: "ImportEditPrefab", entity });
        });

        await Deno.remove(path.join(importedDir, "project.json"));

        return { success: true };
      },
    ),
  );
};
