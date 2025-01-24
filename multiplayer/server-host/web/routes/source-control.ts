import { z } from "@dreamlab/vendor/zod.ts";
import { CONFIG } from "../../config.ts";
import { Router, Status } from "../../deps/oak.ts";
import { GameInstance } from "../../instance.ts";
import { JsonAPIError } from "../util/api.ts";

import * as fs from "jsr:@std/fs@1";
import * as path from "jsr:@std/path@1";

export const serveSourceControlAPI = (router: Router) => {
  // TODO: auth ??
  // #region commit
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
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
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
    const commitStatus = await commitProcess.status;
    if (!commitStatus.success) {
      throw new JsonAPIError(Status.InternalServerError, "Failed to commit to repository");
    }

    const pushProcess = new Deno.Command("git", {
      args: ["push", `${CONFIG.gitBase}/${instance.info.worldId}.git`, "main"],
      cwd: sourceRoot,
    }).spawn();
    const pushStatus = await pushProcess.status;

    if (!pushStatus.success) {
      // If we failed to push to main, fallback to pushing a new branch
      {
        const fetchCmd = new Deno.Command("git", {
          args: ["fetch", "origin", "main"],
          cwd: sourceRoot,
        }).spawn();
        const fetchStatus = await fetchCmd.status;
        if (!fetchStatus.success) {
          throw new JsonAPIError(Status.InternalServerError, "Failed to fetch origin main");
        }
      }

      const timestamp = new Date()
        .toISOString()
        .replace("T", "-")
        .replace("Z", "")
        .replace(/[:.]/g, "-");
      const newBranch = `edit-${timestamp}`;

      {
        const branchCmd = new Deno.Command("git", {
          args: ["checkout", "-b", newBranch],
          cwd: sourceRoot,
        }).spawn();
        const branchStatus = await branchCmd.status;
        if (!branchStatus.success) {
          throw new JsonAPIError(
            Status.InternalServerError,
            "Failed to create new branch locally",
          );
        }
      }

      {
        const pushBranchCmd = new Deno.Command("git", {
          args: ["push", "-u", `${CONFIG.gitBase}/${instance.info.worldId}.git`, newBranch],
          cwd: sourceRoot,
        }).spawn();
        const pushBranchStatus = await pushBranchCmd.status;
        if (!pushBranchStatus.success) {
          throw new JsonAPIError(
            Status.InternalServerError,
            `Failed to push to new branch '${newBranch}'`,
          );
        }
      }

      ctx.response.body = {
        success: true,
        fallbackBranch: newBranch,
        message: `Pushed to new branch '${newBranch}' since pushing 'main' was rejected.`,
      };
      return;
    }

    ctx.response.body = { success: true };
    ctx.response.type = "application/json";
  });
  // #endregion

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

            // if the path has a space in it, for some reason it's wrapped in quotes which we need to remove
            if (filePath[0] === '"' && filePath[filePath.length - 1] === '"') {
              filePath = filePath.slice(1, -1);
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

  // #region stage
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
  // #endregion

  // #region unstage
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
  // #endregion

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

  // #region discard
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

    if (filePath === "project.json") {
      instance.session?.ipc.send({ op: "ReloadEditScene" });
    }
  });
  // #endregion

  // #region history
  router.get("/api/v1/source-control/:instance_id/history", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    try {
      const logProcess = new Deno.Command("git", {
        args: [
          "log",
          "--all",
          "--pretty=format:%H|%P|%D|%s|%an|%ae|%ad",
          "--date=iso",
          "--abbrev-commit",
          "--topo-order",
        ],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      });

      const outputResult = await logProcess.output();
      const logOutput = new TextDecoder().decode(outputResult.stdout);
      const lines = logOutput.split("\n").filter(line => line.trim() !== "");

      const commits = lines.map(line => {
        const [hash, parentLine, refLine, message, authorName, authorEmail, date] =
          line.split("|");

        const parents = parentLine ? parentLine.split(" ") : [];
        const refs = refLine
          .split(",")
          .map(r => r.trim())
          .filter(Boolean);

        return {
          hash,
          parents,
          refs,
          message,
          author: { name: authorName, email: authorEmail },
          date,
        };
      });

      ctx.response.body = { commits };
    } catch (err) {
      throw new JsonAPIError(Status.InternalServerError, err.message);
    }
  });
  // #endregion

  // #region checkout
  router.post("/api/v1/source-control/:instance_id/checkout", async ctx => {
    const BodySchema = z.object({
      branch_name: z.string(),
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
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }

    const sourceRoot = instance.info.worldDirectory;
    const branchName = body.branch_name;

    try {
      const checkoutProcess = new Deno.Command("git", {
        args: ["checkout", branchName],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      });
      const checkoutResult = await checkoutProcess.output();

      if (checkoutResult.code !== 0) {
        const errorOutput = new TextDecoder().decode(checkoutResult.stderr);
        throw new JsonAPIError(
          Status.InternalServerError,
          `Failed to checkout branch: ${errorOutput}`,
        );
      }

      ctx.response.body = {
        success: true,
        message: `Successfully checked out branch '${branchName}'`,
      };
      ctx.response.type = "application/json";
    } catch (error) {
      console.error(error);
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });
  // #endregion

  // #region pull
  router.post("/api/v1/source-control/:instance_id/pull", async ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);

    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }

    const sourceRoot = instance.info.worldDirectory;

    async function runGitCommand(args: string[]) {
      const proc = new Deno.Command("git", {
        args,
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      });
      const output = await proc.output();
      const code = output.code;
      const stdout = new TextDecoder().decode(output.stdout);
      const stderr = new TextDecoder().decode(output.stderr);

      return { code, stdout, stderr };
    }

    try {
      // 1) Check if there are ANY local changes. If so, stash them before pulling.
      const statusRes = await runGitCommand(["status", "--porcelain"]);
      const hasLocalChanges = statusRes.stdout.trim().length > 0;
      let stashed = false;

      if (hasLocalChanges) {
        const stashMsg = `WIP: auto-stash local changes before pull ${new Date().toISOString()}`;
        const stashRes = await runGitCommand(["stash", "push", "-u", "-m", stashMsg]);
        if (stashRes.code !== 0) {
          throw new JsonAPIError(
            Status.InternalServerError,
            `Failed to stash local changes: ${stashRes.stderr}`,
          );
        }
        stashed = true;
      }

      // 2) Now do a normal "git pull"
      const pullRes = await runGitCommand(["pull"]);
      if (pullRes.code !== 0) {
        if (stashed) {
          await runGitCommand(["stash", "pop"]);
        }
        throw new JsonAPIError(
          Status.InternalServerError,
          `Pull failed: ${pullRes.stderr || pullRes.stdout}`,
        );
      }

      // 3) If we stashed changes, attempt to reapply them (stash pop).
      if (stashed) {
        const popRes = await runGitCommand(["stash", "pop"]);

        // Check if it's a conflict scenario
        if (popRes.code !== 0) {
          const { stdout, stderr } = popRes;
          const conflictText = (stdout + stderr).toLowerCase();

          if (
            conflictText.includes("conflict") ||
            conflictText.includes("merge conflict") ||
            conflictText.includes("automatic merge failed")
          ) {
            // (a) Create conflict branch from current HEAD (which has partial stash changes).
            const conflictBranch = `conflict-${new Date()
              .toISOString()
              .replace(/[^\d]/g, "-")}`;
            const branchCmd = await runGitCommand(["checkout", "-b", conflictBranch]);
            if (branchCmd.code !== 0) {
              throw new JsonAPIError(
                Status.InternalServerError,
                `Failed to create conflict branch: ${branchCmd.stderr}`,
              );
            }

            // (b) Stage & commit conflict markers
            await runGitCommand(["add", "--all"]);
            const commitRes = await runGitCommand([
              "commit",
              "-m",
              `WIP: stash-pop conflict, see branch ${conflictBranch}`,
              "--allow-empty",
            ]);
            if (commitRes.code !== 0) {
              console.warn(
                "Warning: Could not commit conflict markers. Possibly unmerged paths remain.",
              );
            }

            // (c) Push the conflict branch
            const pushRes = await runGitCommand(["push", "-u", "origin", conflictBranch]);
            if (pushRes.code !== 0) {
              throw new JsonAPIError(
                Status.InternalServerError,
                `Failed to push stash-conflict branch '${conflictBranch}': ${pushRes.stderr}`,
              );
            }

            ctx.response.body = {
              success: false,
              conflictBranch,
              message: `Pull succeeded, but reapplying local changes caused conflicts. A 'conflict' branch '${conflictBranch}' was created and pushed. Please resolve conflicts on Forgejo.`,
            };
            return;
          } else {
            throw new JsonAPIError(
              Status.InternalServerError,
              `Failed to reapply stashed changes (non-conflict error): ${stderr || stdout}`,
            );
          }
        }
      }

      // 4) Success: either no stash needed or stash popped with no conflict
      ctx.response.body = {
        success: true,
        message: stashed
          ? "Pulled remote changes and re-applied your stashed changes successfully."
          : "Pulled remote changes (no local changes to stash).",
      };
    } catch (error) {
      console.error("=== Caught error in pull handler:", error);
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });
  // #endregion
};
