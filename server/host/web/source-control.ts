import { Router, Status } from "oak";

import { getWorldPath } from "../config.ts";
import type { RunningInstance } from "../instance/mod.ts";

import { bearerTokenAuth, jsonError } from "./util.ts";

import * as path from "@std/path";
import * as fs from "@std/fs";
import { APP_CONFIG } from "../config.ts";
import { z } from "zod";

export const sourceControlRoutes = (
  router: Router,
  instances: Map<string, RunningInstance>,
) => {
  // #region Commit files
  router.post("/api/v1/source-control/:instance_id/commit", async ctx => {
    const BodySchema = z.object({
      commit_message: z.string(),
      author_name: z.string(),
      author_email: z.string(),
    });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body({ type: "json" }).value);
    } catch (err) {
      jsonError(ctx, Status.BadRequest, err.toString());
      return;
    }

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

    bearerTokenAuth(APP_CONFIG.coordAuthSecret);

    const worldFolder = path.join(
      Deno.cwd(),
      "runtime",
      "worlds",
      getWorldPath(instance.worldId, instance.worldVariant),
    );

    const commitProcess = new Deno.Command("git", {
      args: [
        "commit",
        "-m",
        body.commit_message,
        "--author",
        `${body.author_name} <${body.author_email}>`,
      ],
      cwd: worldFolder,
    }).spawn();
    if (!(await commitProcess.status).success) {
      jsonError(ctx, Status.InternalServerError, "Failed to commit to repository");
      return;
    }

    const pushProcess = new Deno.Command("git", {
      args: ["push", `${APP_CONFIG.adminPushBaseUrl}/${instance.worldId}.git`, "main"],
      cwd: worldFolder,
    }).spawn();
    if (!(await pushProcess.status).success) {
      jsonError(ctx, Status.InternalServerError, "Failed to push to repository");
      return;
    }

    ctx.response.body = { success: true };
  });

  // #region Get File Content
  router.get("/api/v1/source-control/:instance_id/file/:path*", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = instances.get(instanceId);
    if (instance === undefined) {
      jsonError(ctx, Status.NotFound, "An instance with the given ID does not exist");
      return;
    }

    bearerTokenAuth(APP_CONFIG.coordAuthSecret);

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

    try {
      // kludge to make image display instead of downloading
      // TODO: always send the proper mime type.
      const extension = relativePath.split(".").pop();
      if (extension === "png") {
        ctx.response.type = "image/png";
      } else if (extension === "jpg" || extension === "jpeg") {
        ctx.response.type = "image/png";
      } else {
        ctx.response.type = "application/octet-stream";
      }
      await ctx.send({ root: worldFolder, path: relativePath, hidden: true });
    } catch {
      ctx.response.type = "text/plain";
      ctx.response.status = Status.NotFound;
      ctx.response.body = "Not Found";
    }
  });

  // #region Get changed files
  router.get("/api/v1/source-control/:instance_id/files", async ctx => {
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

    bearerTokenAuth(APP_CONFIG.coordAuthSecret);

    const worldFolder = path.join(
      Deno.cwd(),
      "runtime",
      "worlds",
      getWorldPath(instance.worldId, instance.worldVariant),
    );

    const statusProcess = new Deno.Command("git", {
      args: ["status", "--porcelain"],
      cwd: worldFolder,
      stdout: "piped",
      stderr: "piped",
    });

    try {
      const outputResult = await statusProcess.output();
      const output = new TextDecoder().decode(outputResult.stdout);
      const files = await Promise.all(
        output
          .split("\n")
          .filter(line => line.trim() !== "")
          .map(async line => {
            const changeType = line.slice(0, 2).trim();
            let filePath = line.slice(3);
            let fileContent = "";

            if (changeType === "R") {
              const [_oldPath, newPath] = filePath.split(" -> ");
              filePath = newPath;
            }

            if (changeType !== "D") {
              const diffProcess = new Deno.Command("git", {
                args: ["diff", "--", filePath],
                cwd: worldFolder,
                stdout: "piped",
                stderr: "piped",
              });
              const diffOutputResult = await diffProcess.output();
              fileContent = new TextDecoder().decode(diffOutputResult.stdout);
            }

            return {
              path: filePath,
              changeType:
                changeType === "??" ? "created" : changeType === "M" ? "modified" : "deleted",
              content: fileContent,
            };
          }),
      );

      const filteredFiles = files.filter(file => {
        const fileName = path.basename(file.path);
        return !fileName.includes("bundled.js") && !fileName.includes("bundled.js.map");
      });

      ctx.response.body = { files: filteredFiles };
    } catch (error) {
      console.error(error);
      jsonError(ctx, Status.InternalServerError, error.message);
    }
  });

  // #region Get staged files
  router.get("/api/v1/source-control/:instance_id/stages", async ctx => {
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

    bearerTokenAuth(APP_CONFIG.coordAuthSecret);

    const worldFolder = path.join(
      Deno.cwd(),
      "runtime",
      "worlds",
      getWorldPath(instance.worldId, instance.worldVariant),
    );

    const statusProcess = new Deno.Command("git", {
      args: ["diff", "--cached", "--name-status"],
      cwd: worldFolder,
      stdout: "piped",
      stderr: "piped",
    });

    try {
      const outputResult = await statusProcess.output();
      const output = new TextDecoder().decode(outputResult.stdout);
      const files = await Promise.all(
        output
          .split("\n")
          .filter(line => line.trim() !== "")
          .map(async line => {
            const [changeType, filePath] = line.split("\t");
            let fileContent = "";

            if (changeType !== "D") {
              const diffProcess = new Deno.Command("git", {
                args: ["diff", "--cached", "--", filePath],
                cwd: worldFolder,
                stdout: "piped",
                stderr: "piped",
              });
              const diffOutputResult = await diffProcess.output();
              fileContent = new TextDecoder().decode(diffOutputResult.stdout);
            }

            return {
              path: filePath,
              changeType:
                changeType === "A" ? "created" : changeType === "M" ? "modified" : "deleted",
              content: fileContent,
            };
          }),
      );

      ctx.response.body = { files };
    } catch (error) {
      console.error(error);
      jsonError(ctx, Status.InternalServerError, error.message);
    }
  });

  // #region Stage file
  router.put(
    "/api/v1/source-control/:instance_id/stage",
    async ctx => {
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

      const requestBody = await ctx.request.body().value;
      const filePath = requestBody.path;

      if (!filePath) {
        jsonError(ctx, Status.BadRequest, "File path is required");
        return;
      }

      const worldFolder = path.join(
        Deno.cwd(),
        "runtime",
        "worlds",
        getWorldPath(instance.worldId, instance.worldVariant),
      );

      const fullPath = path.join(worldFolder, filePath);

      try {
        const fileExists = await fs.exists(fullPath);
        if (fileExists) {
          const addProcess = new Deno.Command("git", {
            args: ["add", filePath],
            cwd: worldFolder,
            stderr: "piped",
            stdout: "null",
          }).spawn();
          await addProcess.status;
        } else {
          const lsFilesProcess = new Deno.Command("git", {
            args: ["ls-files", "--deleted", "--full-name", filePath],
            cwd: worldFolder,
            stdout: "piped",
            stderr: "piped",
          });
          const outputResult = await lsFilesProcess.output();
          const output = new TextDecoder().decode(outputResult.stdout).trim();

          if (output === filePath) {
            const rmProcess = new Deno.Command("git", {
              args: ["rm", "--cached", filePath],
              cwd: worldFolder,
              stderr: "piped",
              stdout: "null",
            }).spawn();
            await rmProcess.status;
          } else {
            jsonError(ctx, Status.NotFound, "File does not exist");
            return;
          }
        }

        ctx.response.body = {
          success: true,
          message: "File staged successfully.",
        };
      } catch (error) {
        jsonError(ctx, Status.InternalServerError, error.message);
      }
    },
    bearerTokenAuth(APP_CONFIG.coordAuthSecret),
  );

  // #region Unstage file
  router.delete(
    "/api/v1/source-control/:instance_id/unstage",
    async ctx => {
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

      const requestBody = await ctx.request.body().value;
      const filePath = requestBody.path;

      if (!filePath) {
        jsonError(ctx, Status.BadRequest, "File path is required");
        return;
      }

      const worldFolder = path.join(
        Deno.cwd(),
        "runtime",
        "worlds",
        getWorldPath(instance.worldId, instance.worldVariant),
      );

      try {
        const lsFilesProcess = new Deno.Command("git", {
          args: ["ls-files", "--deleted", "--cached", "--full-name", filePath],
          cwd: worldFolder,
          stdout: "piped",
          stderr: "piped",
        });
        const outputResult = await lsFilesProcess.output();
        const output = new TextDecoder().decode(outputResult.stdout).trim();

        if (output === filePath) {
          const rmProcess = new Deno.Command("git", {
            args: ["rm", "--cached", filePath],
            cwd: worldFolder,
            stderr: "piped",
            stdout: "null",
          }).spawn();
          await rmProcess.status;
          const resetProcess = new Deno.Command("git", {
            args: ["reset", "HEAD", filePath],
            cwd: worldFolder,
            stderr: "piped",
            stdout: "null",
          }).spawn();
          await resetProcess.status;
        } else {
          const resetProcess = new Deno.Command("git", {
            args: ["reset", "HEAD", filePath],
            cwd: worldFolder,
            stderr: "piped",
            stdout: "null",
          }).spawn();
          await resetProcess.status;
        }

        ctx.response.body = {
          success: true,
          message: "File unstaged successfully.",
        };
      } catch (error) {
        jsonError(ctx, Status.InternalServerError, error.message);
      }
    },
    bearerTokenAuth(APP_CONFIG.coordAuthSecret),
  );

  // #region Edit
  router.put(
    "/api/v1/source-control/:instance_id/files/:path*",
    async ctx => {
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

      const worldFolder = path.join(
        Deno.cwd(),
        "runtime",
        "worlds",
        getWorldPath(instance.worldId, instance.worldVariant),
      );

      const filePath = ctx.params.path;
      if (filePath === undefined) {
        jsonError(ctx, Status.BadRequest, "An invalid path was provided!");
        return;
      }

      const computedPath = path.join(worldFolder, filePath);
      const relativePath = path.relative(worldFolder, computedPath);
      if (relativePath.startsWith("..")) {
        jsonError(ctx, Status.BadRequest, "An invalid path was provided!");
        return;
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

      ctx.response.body = { success: true };

      if (ctx.request.url.searchParams.get("no_restart") !== "true") {
        instance.restart();
      }
    },
    bearerTokenAuth(APP_CONFIG.coordAuthSecret),
  );

  // #region Discard changes
  router.post(
    "/api/v1/source-control/:instance_id/discard",
    async ctx => {
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

      const worldFolder = path.join(
        Deno.cwd(),
        "runtime",
        "worlds",
        getWorldPath(instance.worldId, instance.worldVariant),
      );

      const requestBody = await ctx.request.body().value;
      const filePath = requestBody.path;

      if (!filePath) {
        jsonError(ctx, Status.BadRequest, "File path is required");
        return;
      }

      try {
        const restoreProcess = new Deno.Command("git", {
          args: ["restore", filePath],
          cwd: worldFolder,
          stderr: "piped",
          stdout: "null",
        }).spawn();
        await restoreProcess.status;

        const cleanProcess = new Deno.Command("git", {
          args: ["clean", "-fd", filePath],
          cwd: worldFolder,
          stderr: "piped",
          stdout: "null",
        }).spawn();
        await cleanProcess.status;

        ctx.response.body = {
          success: true,
          message: `Changes discarded successfully for file: ${filePath}`,
        };

        if (ctx.request.url.searchParams.get("no_restart") !== "true") {
          instance.restart();
        }
      } catch (error) {
        jsonError(ctx, Status.InternalServerError, error.message);
      }
    },
    bearerTokenAuth(APP_CONFIG.coordAuthSecret),
  );

  // #region Get commit history
  router.get("/api/v1/source-control/:instance_id/history", async ctx => {
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

    bearerTokenAuth(APP_CONFIG.coordAuthSecret);

    const worldFolder = path.join(
      Deno.cwd(),
      "runtime",
      "worlds",
      getWorldPath(instance.worldId, instance.worldVariant),
    );

    try {
      const logProcess = new Deno.Command("git", {
        args: ["log", "--pretty=format:%H|%an|%ae|%cd|%s"],
        cwd: worldFolder,
        stdout: "piped",
        stderr: "piped",
      });

      const outputResult = await logProcess.output();
      const logOutput = new TextDecoder().decode(outputResult.stdout);

      const commits = logOutput
        .split("\n")
        .filter(line => line.trim() !== "")
        .map(line => {
          const [hash, authorName, authorEmail, date, message] = line.split("|");
          return {
            hash,
            author: {
              name: authorName,
              email: authorEmail,
            },
            date,
            message,
          };
        });

      ctx.response.body = { commits };
    } catch (error) {
      jsonError(ctx, Status.InternalServerError, error.message);
    }
  });
};
