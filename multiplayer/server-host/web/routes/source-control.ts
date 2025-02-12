import { z } from "@dreamlab/vendor/zod.ts";
import { Router, Status } from "@oak/oak";
import { CONFIG } from "../../config.ts";
import { GameInstance } from "../../instance.ts";
import { JsonAPIError } from "../util/api.ts";

import * as fs from "@std/fs";
import * as path from "@std/path";
import { fileIsProbablyBehaviorScript } from "../../../../build-system/build-world.ts";
import { buildWorld } from "../../world-build.ts";

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

      const computedPath = path.join(sourceRoot, filePath);
      const relativePath = path.relative(sourceRoot, computedPath);

      let fileExists = true;
      try {
        await Deno.stat(computedPath);
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          fileExists = false;
        } else {
          throw err;
        }
      }

      if (fileExists) {
        await buildWorld(instance.info.worldId, instance.info.worldDirectory, "_dist");
        const isBehavior = await fileIsProbablyBehaviorScript(computedPath);
        instance.session?.broadcastPacket({
          t: "ScriptEdited",
          script_location: relativePath,
          behavior_script_id: isBehavior
            ? `res://${relativePath.replace(/\.tsx?$/, ".js")}`
            : undefined,
        });
      } else {
        instance.session?.broadcastPacket({
          t: "ScriptEdited",
          script_location: relativePath,
          behavior_script_id: undefined,
        });
      }

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
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "An instance with the given ID does not exist");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode");
    }

    const sourceRoot = instance.info.worldDirectory;

    async function runGitCommand(args: string[]): Promise<string[]> {
      const proc = new Deno.Command("git", {
        args,
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      });
      const output = await proc.output();
      const stdout = new TextDecoder().decode(output.stdout);
      if (output.code !== 0) {
        const stderr = new TextDecoder().decode(output.stderr);
        throw new Error(stderr || "Git command failed.");
      }
      return stdout
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
    }

    try {
      await runGitCommand(["fetch", "--all"]);

      const branches = await runGitCommand(["branch", "-a", "--format=%(refname:short)"]);

      const logArgs = [
        "log",
        ...branches,
        "--pretty=format:%H|%P|%D|%s|%an|%ae|%ad",
        "--date=iso",
        "--abbrev-commit",
        "--topo-order",
      ];
      const logOutput = await runGitCommand(logArgs);

      const commits = logOutput.map(line => {
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

      const currentBranchResult = await runGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
      const currentBranch = currentBranchResult[0] || "unknown";

      ctx.response.body = { commits, currentBranch };
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

  // #region revert
  router.post("/api/v1/source-control/:instance_id/revert", async ctx => {
    const BodySchema = z.object({
      commit_hash: z.string(),
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

    const resetProc = new Deno.Command("git", {
      args: ["reset", "--hard", body.commit_hash],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const resetOutput = await resetProc.output();
    if (resetOutput.code !== 0) {
      const errMsg = new TextDecoder().decode(resetOutput.stderr);
      throw new JsonAPIError(
        Status.InternalServerError,
        `Failed to revert to commit ${body.commit_hash}: ${errMsg}`,
      );
    }

    const cleanProc = new Deno.Command("git", {
      args: ["clean", "-fd"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const cleanOutput = await cleanProc.output();
    if (cleanOutput.code !== 0) {
      const errMsg = new TextDecoder().decode(cleanOutput.stderr);
      throw new JsonAPIError(
        Status.InternalServerError,
        `Failed to clean untracked files: ${errMsg}`,
      );
    }

    const pushProc = new Deno.Command("git", {
      args: ["push", "--force"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const pushOutput = await pushProc.output();
    if (pushOutput.code !== 0) {
      const errMsg = new TextDecoder().decode(pushOutput.stderr);
      throw new JsonAPIError(
        Status.InternalServerError,
        `Failed to push changes to remote: ${errMsg}`,
      );
    }

    ctx.response.body = {
      success: true,
      message: `Hard reverted to commit ${body.commit_hash} and pushed to remote.`,
    };
    ctx.response.type = "application/json";
  });
  //#endregion

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
      return {
        code: output.code,
        stdout: new TextDecoder().decode(output.stdout),
        stderr: new TextDecoder().decode(output.stderr),
      };
    }

    try {
      const diffIndex = await runGitCommand(["diff", "--cached", "--name-only"]);
      const hasStagedChanges = diffIndex.stdout.trim().length > 0;

      const diffWorkspace = await runGitCommand(["diff", "--name-only"]);
      const hasUnstagedChanges = diffWorkspace.stdout.trim().length > 0;
      const unstagedFiles = diffWorkspace.stdout
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "");

      let tempBranch = null;

      if (hasStagedChanges || hasUnstagedChanges) {
        tempBranch = `merge-conflict-${new Date()
          .toISOString()
          .replace(/[^\d]/g, "-")
          .replace(/-$/, "")}`;
        await runGitCommand(["checkout", "-b", tempBranch]);
        await runGitCommand(["add", "--all"]);
        const commitRes = await runGitCommand([
          "commit",
          "-m",
          `Saved local changes in branch '${tempBranch}'`,
        ]);
        if (commitRes.code !== 0) {
          throw new JsonAPIError(
            Status.InternalServerError,
            `Failed to commit local changes: ${commitRes.stderr}`,
          );
        }

        // Return to the main branch.
        const checkoutMain = await runGitCommand(["checkout", "main"]);
        if (checkoutMain.code !== 0) {
          throw new JsonAPIError(
            Status.InternalServerError,
            `Failed to switch back to main branch: ${checkoutMain.stderr}`,
          );
        }
      }

      // Pull remote changes.
      const pullRes = await runGitCommand(["pull", "--rebase"]);
      if (pullRes.code !== 0) {
        throw new JsonAPIError(
          Status.InternalServerError,
          `Failed to pull remote changes: ${pullRes.stderr}`,
        );
      }

      // Reapply local changes (if any).
      if (tempBranch) {
        const cherryPickRes = await runGitCommand(["cherry-pick", "--no-commit", tempBranch]);
        if (cherryPickRes.code !== 0) {
          const conflictText = cherryPickRes.stderr.toLowerCase();
          if (
            conflictText.includes("conflict") ||
            conflictText.includes("merge conflict") ||
            conflictText.includes("automatic merge failed")
          ) {
            // Push conflict branch for manual resolution.
            const pushConflictBranch = await runGitCommand([
              "push",
              "-u",
              "origin",
              tempBranch,
            ]);
            if (pushConflictBranch.code !== 0) {
              throw new JsonAPIError(
                Status.InternalServerError,
                `Failed to push conflict branch '${tempBranch}': ${pushConflictBranch.stderr}`,
              );
            }

            const resetMain = await runGitCommand(["reset", "--hard", "origin/main"]);
            if (resetMain.code !== 0) {
              throw new JsonAPIError(
                Status.InternalServerError,
                `Failed to reset to main branch: ${resetMain.stderr}`,
              );
            }

            const checkoutMain = await runGitCommand(["checkout", "main"]);
            if (checkoutMain.code !== 0) {
              throw new JsonAPIError(
                Status.InternalServerError,
                `Failed to switch back to the main branch after resetting: ${checkoutMain.stderr}`,
              );
            }

            ctx.response.body = {
              success: false,
              conflictBranch: tempBranch,
              message: `Conflicts detected while reapplying local changes. Changes pushed to conflict branch '${tempBranch}'. Please resolve manually.`,
            };
            return;
          }

          throw new JsonAPIError(
            Status.InternalServerError,
            `Failed to reapply local changes: ${cherryPickRes.stderr}`,
          );
        }

        // Unstage files that were originally unstaged.
        if (unstagedFiles.length > 0) {
          const resetRes = await runGitCommand(["reset", "HEAD", "--", ...unstagedFiles]);
          if (resetRes.code !== 0) {
            throw new JsonAPIError(
              Status.InternalServerError,
              `Failed to unstage files: ${resetRes.stderr}`,
            );
          }
        }

        // Delete the temporary branch.
        const deleteBranchRes = await runGitCommand(["branch", "-D", tempBranch]);
        if (deleteBranchRes.code !== 0) {
          console.warn(
            `Failed to delete temporary branch '${tempBranch}': ${deleteBranchRes.stderr}`,
          );
        }
      }

      ctx.response.body = {
        success: true,
        message: tempBranch
          ? "Pulled remote changes and reapplied local changes as unstaged where applicable."
          : "Pulled remote changes successfully. No local changes to reapply.",
      };
    } catch (error) {
      console.error("=== Caught error in pull handler:", error);
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });
  // #endregion
};
