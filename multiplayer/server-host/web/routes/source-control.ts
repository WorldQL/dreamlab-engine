import { z } from "@dreamlab/vendor/zod.ts";
import { Router, Status } from "../../deps/oak.ts";
import { JsonAPIError } from "../util/api.ts";
import { GameInstance } from "../../instance.ts";
import { CONFIG } from "../../config.ts";

import * as fs from "jsr:@std/fs@1";
import * as path from "jsr:@std/path@1";

export const serveSourceControlAPI = (router: Router) => {
  // TODO: auth ??
  router.post("/api/v1/source-control/:instance_id/commit", async ctx => {
    const BodySchema = z.object({
      commit_message: z.string(),
      author_name: z.string(),
      author_email: z.string(),
    });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      throw new JsonAPIError(Status.BadRequest, err.toString());
    }

    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    const commitProcess = new Deno.Command("git", {
      args: [
        "commit",
        "-m",
        body.commit_message,
        "--author",
        `${body.author_name} <${body.author_email}>`,
      ],
      cwd: sourceRoot,
    }).spawn();
    if (!(await commitProcess.status).success) {
      throw new JsonAPIError(Status.InternalServerError, "Failed to commit to repository");
    }

    const pushProcess = new Deno.Command("git", {
      args: ["push", `${CONFIG.gitBase}/${instance.info.worldId}.git`, "main"],
      cwd: sourceRoot,
    }).spawn();
    if (!(await pushProcess.status).success) {
      throw new JsonAPIError(Status.InternalServerError, "Failed to push to repository");
    }

    ctx.response.body = { success: true };
    ctx.response.type = "application/json";
  });

  router.get("/api/v1/source-control/:instance_id/file/:path*", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    const filePath = ctx.params.path;
    if (filePath === undefined || filePath.length === 0) {
      const files: string[] = [];
      for await (const entry of fs.expandGlob("**/*", {
        root: path.dirname(sourceRoot),
        exclude: ["node_modules", ".git"],
      })) {
        if (entry.isFile) {
          files.push(path.relative(sourceRoot, entry.path));
        }
      }

      ctx.response.body = { files };
      return;
    }

    const computedPath = path.join(sourceRoot, filePath);
    const relativePath = path.relative(sourceRoot, computedPath);
    if (relativePath.startsWith("..")) {
      throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
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
      await ctx.send({ root: sourceRoot, path: relativePath, hidden: true });
    } catch {
      ctx.response.type = "text/plain";
      ctx.response.status = Status.NotFound;
      ctx.response.body = "Not Found";
    }
  });

  router.get("/api/v1/source-control/:instance_id/files", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    const statusProcess = new Deno.Command("git", {
      args: ["status", "--porcelain"],
      cwd: sourceRoot,
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
                cwd: sourceRoot,
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
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });

  router.get("/api/v1/source-control/:instance_id/stages", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);

    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    const statusProcess = new Deno.Command("git", {
      args: ["diff", "--cached", "--name-status"],
      cwd: sourceRoot,
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
                cwd: sourceRoot,
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
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });

  router.put("/api/v1/source-control/:instance_id/stage", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);

    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const requestBody = await ctx.request.body.json();
    const filePath = requestBody.path;

    if (!filePath) {
      throw new JsonAPIError(Status.BadRequest, "File path is required");
    }

    const sourceRoot = instance.info.worldDirectory;

    const fullPath = path.join(sourceRoot, filePath);

    try {
      const fileExists = await fs.exists(fullPath);
      if (fileExists) {
        const addProcess = new Deno.Command("git", {
          args: ["add", filePath],
          cwd: sourceRoot,
          stderr: "piped",
          stdout: "null",
        }).spawn();
        await addProcess.status;
      } else {
        const lsFilesProcess = new Deno.Command("git", {
          args: ["ls-files", "--deleted", "--full-name", filePath],
          cwd: sourceRoot,
          stdout: "piped",
          stderr: "piped",
        });
        const outputResult = await lsFilesProcess.output();
        const output = new TextDecoder().decode(outputResult.stdout).trim();

        if (output === filePath) {
          const rmProcess = new Deno.Command("git", {
            args: ["rm", "--cached", filePath],
            cwd: sourceRoot,
            stderr: "piped",
            stdout: "null",
          }).spawn();
          await rmProcess.status;
        } else {
          throw new JsonAPIError(Status.NotFound, "File does not exist");
        }
      }

      ctx.response.body = {
        success: true,
        message: "File staged successfully.",
      };
    } catch (error) {
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });

  router.delete("/api/v1/source-control/:instance_id/unstage", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);

    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const requestBody = await ctx.request.body.json();
    const filePath = requestBody.path;

    if (!filePath) {
      throw new JsonAPIError(Status.BadRequest, "File path is required");
    }

    const sourceRoot = instance.info.worldDirectory;

    try {
      const lsFilesProcess = new Deno.Command("git", {
        args: ["ls-files", "--deleted", "--cached", "--full-name", filePath],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      });
      const outputResult = await lsFilesProcess.output();
      const output = new TextDecoder().decode(outputResult.stdout).trim();

      if (output === filePath) {
        const rmProcess = new Deno.Command("git", {
          args: ["rm", "--cached", filePath],
          cwd: sourceRoot,
          stderr: "piped",
          stdout: "null",
        }).spawn();
        await rmProcess.status;
        const resetProcess = new Deno.Command("git", {
          args: ["reset", "HEAD", filePath],
          cwd: sourceRoot,
          stderr: "piped",
          stdout: "null",
        }).spawn();
        await resetProcess.status;
      } else {
        const resetProcess = new Deno.Command("git", {
          args: ["reset", "HEAD", filePath],
          cwd: sourceRoot,
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
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });

  router.put("/api/v1/source-control/:instance_id/files/:path*", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    const filePath = ctx.params.path;
    if (filePath === undefined) {
      throw new JsonAPIError(Status.BadRequest, "An invalid path was provided!");
    }

    const computedPath = path.join(sourceRoot, filePath);
    const relativePath = path.relative(sourceRoot, computedPath);
    if (relativePath.startsWith("..")) {
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

    ctx.response.body = { success: true };
  });

  router.post("/api/v1/source-control/:instance_id/discard", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);

    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    const requestBody = await ctx.request.body.json();
    const filePath = requestBody.path;

    if (!filePath) {
      throw new JsonAPIError(Status.BadRequest, "File path is required");
    }

    try {
      const restoreProcess = new Deno.Command("git", {
        args: ["restore", filePath],
        cwd: sourceRoot,
        stderr: "piped",
        stdout: "null",
      }).spawn();
      await restoreProcess.status;

      const cleanProcess = new Deno.Command("git", {
        args: ["clean", "-fd", filePath],
        cwd: sourceRoot,
        stderr: "piped",
        stdout: "null",
      }).spawn();
      await cleanProcess.status;

      ctx.response.body = {
        success: true,
        message: `Changes discarded successfully for file: ${filePath}`,
      };
    } catch (error) {
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });

  router.get("/api/v1/source-control/:instance_id/history", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "The instance is not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    try {
      const logProcess = new Deno.Command("git", {
        args: ["log", "--pretty=format:%H|%an|%ae|%cd|%s"],
        cwd: sourceRoot,
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
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });
};
