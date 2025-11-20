import * as z from "@dreamlab/vendor/zod.ts";
import { Router, Status } from "@oak/oak";
import * as path from "@std/path";
import { fileIsProbablyBehaviorScript } from "../../../../build-system/build-world.ts";
import { JsonAPIError } from "../../../common-host/web-util/api.ts";
import { buildWorld } from "../../../common-host/world-build.ts";
import { GameInstance } from "../../instance.ts";

export const serveSourceControlAPI = (router: Router) => {
  async function broadcastWorldUpdate(instance: GameInstance, filePath: string) {
    const sourceRoot = instance.info.worldDirectory;

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
      await buildWorld(instance.info.worldId, sourceRoot, "_dist", instance.logs);

      if (path.basename(filePath) === "project.json") {
        instance.session?.ipc.send({ op: "ReloadEditScene" });
        return;
      }

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
  }

  // #region commit changes
  router.post("/api/v1/source-control/:instance_id/commit", async ctx => {
    const BodySchema = z.object({
      commit_message: z.string(),
      author_name: z.string().optional(),
      author_email: z.string().optional(),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const args = ["commit", "-m", body.commit_message];
    if (body.author_name && body.author_email) {
      args.push("--author", `${body.author_name} <${body.author_email}>`);
    }
    const commitProcess = new Deno.Command("git", { args, cwd: sourceRoot }).spawn();
    const commitStatus = await commitProcess.status;
    if (!commitStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to commit" };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region push
  router.post("/api/v1/source-control/:instance_id/push", async ctx => {
    const BodySchema = z.object({
      remote: z.string().optional().default("origin"),
      branch: z.string().optional().default("main"),
      force: z.boolean().optional().default(false),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const args = ["push"];
    if (body.force) {
      args.push("--force");
    }
    args.push(body.remote, body.branch);
    const pushProcess = new Deno.Command("git", {
      args,
      cwd: sourceRoot,
    }).spawn();
    const pushStatus = await pushProcess.status;
    if (!pushStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error:
          "Push failed: The remote repository appears to have conflicting changes. Please pull the latest changes, resolve any merge conflicts, and try pushing again.",
      };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region pull
  router.post("/api/v1/source-control/:instance_id/pull", async ctx => {
    const BodySchema = z.object({
      remote: z.string().optional().default("origin"),
      branch: z.string().optional().default("main"),
      force: z.boolean().optional().default(false),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    if (body.force) {
      const fetchProcess = new Deno.Command("git", {
        args: ["fetch", body.remote],
        cwd: sourceRoot,
      }).spawn();
      const fetchStatus = await fetchProcess.status;
      if (!fetchStatus.success) {
        ctx.response.status = Status.InternalServerError;
        ctx.response.body = { error: "Fetch failed during force pull." };
        return;
      }
      const resetProcess = new Deno.Command("git", {
        args: ["reset", "--hard", `${body.remote}/${body.branch}`],
        cwd: sourceRoot,
      }).spawn();
      const resetStatus = await resetProcess.status;
      if (!resetStatus.success) {
        ctx.response.status = Status.InternalServerError;
        ctx.response.body = { error: "Reset failed during force pull." };
        return;
      }

      await broadcastWorldUpdate(instance, "project.json");
      ctx.response.body = { success: true };
    } else {
      const pullProcess = new Deno.Command("git", {
        args: ["pull", "--no-edit", body.remote, body.branch],
        cwd: sourceRoot,
        env: {
          ...Deno.env.toObject(),
          GIT_EDITOR: "true",
        },
      }).spawn();
      const pullStatus = await pullProcess.status;
      if (!pullStatus.success) {
        const conflictProcess = new Deno.Command("git", {
          args: ["diff", "--name-only", "--diff-filter=U"],
          cwd: sourceRoot,
          stdout: "piped",
          stderr: "piped",
        }).spawn();
        const conflictOutput = await conflictProcess.output();
        const conflictStdout = new TextDecoder().decode(conflictOutput.stdout).trim();
        const conflictFiles = conflictStdout.split("\n").filter(Boolean);
        if (conflictFiles.length > 0) {
          const abortProcess = new Deno.Command("git", {
            args: ["merge", "--abort"],
            cwd: sourceRoot,
          }).spawn();
          await abortProcess.status;
          ctx.response.status = Status.Conflict;
          ctx.response.body = {
            error: `Pull aborted: Merge conflicts detected between your local branch and ${
              body.remote
            }/${
              body.branch
            }. Please resolve the conflicts in the following files before trying again: ${conflictFiles.join(
              ", ",
            )}.`,
            conflicts: conflictFiles,
          };
          return;
        }
        ctx.response.status = Status.InternalServerError;
        ctx.response.body = { error: "Pull failed due to an unexpected error." };
        return;
      }

      // Clean up deleted remote branches
      const pruneProcess = new Deno.Command("git", {
        args: ["remote", "prune", body.remote],
        cwd: sourceRoot,
      }).spawn();
      await pruneProcess.status;

      await broadcastWorldUpdate(instance, "project.json");
      ctx.response.body = { success: true };
    }
  });
  // #endregion

  // #region stage a file
  router.put("/api/v1/source-control/:instance_id/stage", async ctx => {
    const BodySchema = z.object({
      file: z.union([z.string(), z.boolean()]).optional().default(true),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    const args =
      body.file === true ? ["add", "."] : ["add", stripDoubleQuotes(body.file as string)];

    const addProcess = new Deno.Command("git", {
      args,
      cwd: sourceRoot,
    }).spawn();
    const addStatus = await addProcess.status;
    if (!addStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to stage file" };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region unstage a file
  router.delete("/api/v1/source-control/:instance_id/unstage", async ctx => {
    const BodySchema = z.object({
      file: z.union([z.string(), z.boolean()]).optional().default(true),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    const args =
      body.file === true
        ? ["reset", "HEAD", "."]
        : ["reset", "HEAD", stripDoubleQuotes(body.file as string)];

    const resetProcess = new Deno.Command("git", {
      args,
      cwd: sourceRoot,
    }).spawn();
    const resetStatus = await resetProcess.status;
    if (!resetStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to unstage file" };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

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

      await broadcastWorldUpdate(instance, filePath);

      ctx.response.body = {
        success: true,
        message: `Changes discarded successfully for file: ${filePath}`,
      };
    } catch (error) {
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }

    // this gets called inside broadcastWorldUpdate() above anyway
    // if (filePath === "project.json") {
    //   instance.session?.ipc.send({ op: "ReloadEditScene" });
    // }
  });
  // #endregion

  // #region checkout branch
  router.post("/api/v1/source-control/:instance_id/checkout/branch", async ctx => {
    const BodySchema = z.object({ branch: z.string() });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }

    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }

    const sourceRoot = instance.info.worldDirectory;
    const branch = body.branch;

    const fetchProcess = new Deno.Command("git", {
      args: ["fetch", "origin"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const fetchStatus = await fetchProcess.output();
    if (fetchStatus.code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to fetch updates from remote." };
      return;
    }

    const branchCheckProcess = new Deno.Command("git", {
      args: ["branch", "--list", branch],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const { stdout: branchCheckStdout } = await branchCheckProcess.output();
    const existingBranch = new TextDecoder().decode(branchCheckStdout).trim();

    let checkoutArgs: string[];

    if (existingBranch) {
      checkoutArgs = ["checkout", branch];
    } else {
      checkoutArgs = ["checkout", "-t", `origin/${branch}`];
    }

    const checkoutProcess = new Deno.Command("git", {
      args: checkoutArgs,
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stderr } = await checkoutProcess.output();

    if (code !== 0) {
      const errorMsg = new TextDecoder().decode(stderr);
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: errorMsg.trim() };
      return;
    }
    await broadcastWorldUpdate(instance, "project.json");
    ctx.response.body = { success: true, message: `Checked out branch ${branch}` };
  });
  // #endregion

  // #region checkout commit
  router.post("/api/v1/source-control/:instance_id/checkout/commit", async ctx => {
    const BodySchema = z.object({ commit_hash: z.string() });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }

    const sourceRoot = instance.info.worldDirectory;

    const checkoutProcess = new Deno.Command("git", {
      args: ["checkout", "--detach", body.commit_hash],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    const { code, stderr } = await checkoutProcess.output();
    if (code !== 0) {
      const err = new TextDecoder().decode(stderr).trim();
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to checkout ${body.commit_hash}: ${err}` };
      return;
    }

    await broadcastWorldUpdate(instance, "project.json");
    ctx.response.body = {
      success: true,
      message: `HEAD detached at ${body.commit_hash.slice(0, 7)}`,
    };
  });
  // #endregion

  // #region revert a commit
  router.post("/api/v1/source-control/:instance_id/revert", async ctx => {
    const BodySchema = z.object({ commit_hash: z.string() });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const revertProcess = new Deno.Command("git", {
      args: ["revert", body.commit_hash, "--no-edit"],
      cwd: sourceRoot,
      env: {
        ...Deno.env.toObject(),
        GIT_EDITOR: "true",
      },
    }).spawn();
    const revertStatus = await revertProcess.status;
    if (!revertStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to revert commit ${body.commit_hash}` };
      return;
    }
    await broadcastWorldUpdate(instance, "project.json");

    ctx.response.body = { success: true };
  });
  // #endregion

  // #region revert abort
  router.post("/api/v1/source-control/:instance_id/revert/abort", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    const abortProcess = new Deno.Command("git", {
      args: ["revert", "--abort"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    const { code, stderr } = await abortProcess.output();
    if (code !== 0) {
      const errorMsg = new TextDecoder().decode(stderr).trim();
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to abort revert: ${errorMsg}` };
      return;
    }
    ctx.response.body = { success: true, message: "Revert aborted successfully." };
  });
  // #endregion

  // #region merge
  router.post("/api/v1/source-control/:instance_id/merge", async ctx => {
    const BodySchema = z.object({ source: z.string(), target: z.string() });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    const checkoutProcess = new Deno.Command("git", {
      args: ["checkout", body.target],
      cwd: sourceRoot,
    }).spawn();
    const checkoutStatus = await checkoutProcess.status;
    if (!checkoutStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to checkout branch ${body.target}` };
      return;
    }

    const mergeProcess = new Deno.Command("git", {
      args: ["merge", "--no-edit", body.source],
      cwd: sourceRoot,
      env: {
        ...Deno.env.toObject(),
        GIT_EDITOR: "true",
      },
    }).spawn();
    const mergeStatus = await mergeProcess.status;

    if (!mergeStatus.success) {
      const conflictProcess = new Deno.Command("git", {
        args: ["diff", "--name-only", "--diff-filter=U"],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      }).spawn();
      const conflictOutput = await conflictProcess.output();
      const conflictStdout = new TextDecoder().decode(conflictOutput.stdout).trim();
      const conflictFiles = conflictStdout.split("\n").filter(Boolean);
      const conflicts: { filePath: string; content: string }[] = [];
      for (const file of conflictFiles) {
        try {
          const content = await Deno.readTextFile(path.join(sourceRoot, file));
          conflicts.push({ filePath: file, content });
        } catch {
          // Skip
        }
      }
      ctx.response.status = Status.Conflict;
      ctx.response.body = {
        error: `Merge conflicts detected when merging branch ${body.source} into ${body.target}.`,
        conflicts,
      };
      return;
    }
    await broadcastWorldUpdate(instance, "project.json");

    ctx.response.body = { success: true };
  });
  // #endregion

  // #region merge continue
  router.post("/api/v1/source-control/:instance_id/merge/continue", async ctx => {
    const BodySchema = z.object({
      commit_message: z.string().optional(),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const commitMsg = body.commit_message || "Merge Conflict Fixed";
    const args = ["commit", "-m", commitMsg];

    const continueProcess = new Deno.Command("git", {
      args,
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    const { code, stderr } = await continueProcess.output();
    if (code !== 0) {
      const errorMsg = new TextDecoder().decode(stderr).trim();
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to finalize merge: ${errorMsg}` };
      return;
    }

    ctx.response.body = { success: true, message: "Merge finalized successfully." };
  });
  // #endregion

  // #region rebase
  router.post("/api/v1/source-control/:instance_id/rebase", async ctx => {
    const BodySchema = z.object({
      baseBranch: z.string(),
      remote: z.string().optional().default("origin"),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: "Instance ID is required." };
      return;
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = { error: "Instance not found." };
      return;
    }
    if (!instance.info.editMode) {
      ctx.response.status = Status.Forbidden;
      ctx.response.body = { error: "Not in edit mode." };
      return;
    }
    const sourceRoot = instance.info.worldDirectory;

    let branchToRebaseOnto = body.baseBranch;
    if (!branchToRebaseOnto.startsWith(`${body.remote}/`)) {
      branchToRebaseOnto = `${body.remote}/${branchToRebaseOnto}`;
    }

    const rebaseProcess = new Deno.Command("git", {
      args: ["rebase", branchToRebaseOnto],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
      env: {
        ...Deno.env.toObject(),
        GIT_EDITOR: "true",
      },
    }).spawn();

    const { code, stdout, stderr } = await rebaseProcess.output();
    const decoder = new TextDecoder();
    decoder
      .decode(stdout)
      .split("\n")
      .forEach(line => line.trim());
    decoder
      .decode(stderr)
      .split("\n")
      .forEach(line => line.trim());

    if (code !== 0) {
      // Abort rebase if conflict occurs
      const abortProcess = new Deno.Command("git", {
        args: ["rebase", "--abort"],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      }).spawn();
      await abortProcess.output();
      ctx.response.status = Status.Conflict;
      ctx.response.body = {
        error: `Rebase failed due to conflicts when rebasing onto ${branchToRebaseOnto}. Rebase aborted.`,
      };
      return;
    }

    await buildWorld("default", Deno.cwd(), "_dist", instance.logs);
    await broadcastWorldUpdate(instance, "project.json");
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region rebase abort
  router.post("/api/v1/source-control/:instance_id/rebase/abort", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    const abortProcess = new Deno.Command("git", {
      args: ["rebase", "--abort"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    const { code, stderr } = await abortProcess.output();
    if (code !== 0) {
      const errorMsg = new TextDecoder().decode(stderr).trim();
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to abort rebase: ${errorMsg}` };
      return;
    }

    ctx.response.body = { success: true, message: "Rebase aborted successfully." };
  });
  // #endregion

  // #region conflicts
  router.get("/api/v1/source-control/:instance_id/conflicts", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    let rebaseStatus = null;
    try {
      const rebaseApplyPath = path.join(sourceRoot, ".git", "rebase-apply");
      await Deno.stat(rebaseApplyPath);
      rebaseStatus = {
        inProgress: true,
        type: "rebase-apply",
        message:
          "A rebase is in progress. Please use 'rebase/continue', 'rebase/abort', or 'rebase/skip'.",
      };
    } catch (_err) {
      try {
        const rebaseMergePath = path.join(sourceRoot, ".git", "rebase-merge");
        await Deno.stat(rebaseMergePath);
        rebaseStatus = {
          inProgress: true,
          type: "rebase-merge",
          message:
            "A rebase is in progress. Please use 'rebase/continue', 'rebase/abort', or 'rebase/skip'.",
        };
      } catch (_err) {
        // No rebase directory exists.
      }
    }

    let revertConflict = null;
    try {
      const revertHeadPath = path.join(sourceRoot, ".git", "REVERT_HEAD");
      await Deno.stat(revertHeadPath);
      revertConflict = {
        inProgress: true,
        type: "revert",
        message:
          "A revert is in progress. Please resolve conflicts in the working tree and finalize the revert.",
      };
    } catch (_err) {
      // No revert conflict.
    }

    const conflictProcess = new Deno.Command("git", {
      args: ["diff", "--name-only", "--diff-filter=U"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    const conflictOutput = await conflictProcess.output();
    const conflictStdout = new TextDecoder().decode(conflictOutput.stdout).trim();
    const conflictFiles = conflictStdout ? conflictStdout.split("\n").filter(Boolean) : [];

    const conflicts = [];
    for (const file of conflictFiles) {
      try {
        const content = await Deno.readTextFile(path.join(sourceRoot, file));
        conflicts.push({ filePath: file, content });
      } catch (_err) {
        // console.error(`Could not read conflict file ${file}:`, err);
      }
    }

    ctx.response.body = {
      conflicted: conflictFiles.length > 0,
      conflicts,
      rebaseStatus,
      revertConflict,
    };
  });
  // #endregion

  // #region resolve merge conflict
  router.post("/api/v1/source-control/:instance_id/resolve-conflict", async ctx => {
    const BodySchema = z.object({
      file: z.string(),
      content: z.string(),
    });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }

    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }

    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }

    const sourceRoot = instance.info.worldDirectory;
    const filePath = path.join(sourceRoot, body.file);

    try {
      await Deno.writeTextFile(filePath, body.content);

      const addProcess = new Deno.Command("git", {
        args: ["add", stripDoubleQuotes(body.file)],
        cwd: sourceRoot,
      }).spawn();
      const addStatus = await addProcess.status;
      if (!addStatus.success) {
        throw new Error("Failed to stage file as resolved.");
      }

      ctx.response.body = {
        success: true,
        message: `Conflict resolved for ${body.file}. Please use the merge/continue endpoint to finalize the merge.`,
      };
    } catch (error) {
      throw new JsonAPIError(
        Status.InternalServerError,
        `Error resolving conflict: ${error.message}`,
      );
    }
  });
  // #endregion

  // #region resolve accept
  router.post("/api/v1/source-control/:instance_id/resolve-conflict/accept", async ctx => {
    const BodySchema = z.object({
      file: z.string(),
      strategy: z.enum(["ours", "theirs"]),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }

    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }

    const sourceRoot = instance.info.worldDirectory;
    const checkoutProcess = new Deno.Command("git", {
      args: ["checkout", `--${body.strategy}`, "--", stripDoubleQuotes(body.file)],
      cwd: sourceRoot,
    }).spawn();
    const checkoutStatus = await checkoutProcess.status;
    if (!checkoutStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to accept ${body.strategy} for ${body.file}` };
      return;
    }

    const addProcess = new Deno.Command("git", {
      args: ["add", stripDoubleQuotes(body.file)],
      cwd: sourceRoot,
    }).spawn();
    const addStatus = await addProcess.status;
    if (!addStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to stage the file after accepting resolution" };
      return;
    }

    ctx.response.body = {
      success: true,
      message: `Accepted ${body.strategy} for ${body.file}`,
    };
  });
  // #endregion

  // #region merge abort
  router.post("/api/v1/source-control/:instance_id/merge/abort", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    const abortProcess = new Deno.Command("git", {
      args: ["merge", "--abort"],
      cwd: sourceRoot,
    }).spawn();
    const abortStatus = await abortProcess.status;
    if (!abortStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to abort merge" };
      return;
    }

    ctx.response.body = { success: true, message: "Merge aborted successfully." };
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

    const limitParam = ctx.request.url.searchParams.get("limit");
    const offsetParam = ctx.request.url.searchParams.get("offset");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (limit !== undefined && (isNaN(limit) || limit <= 0)) {
      throw new JsonAPIError(Status.BadRequest, "Invalid limit parameter");
    }
    if (isNaN(offset) || offset < 0) {
      throw new JsonAPIError(Status.BadRequest, "Invalid offset parameter");
    }

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

      const logArgs = [
        "log",
        "--all",
        "--pretty=format:%H|%P|%D|%s|%an|%ae|%ad",
        "--date=iso",
        "--abbrev-commit",
        "--topo-order",
      ];

      if (offset > 0) {
        logArgs.push(`--skip=${offset}`);
      }
      if (limit !== undefined) {
        logArgs.push(`--max-count=${limit}`);
      }

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

      const countOutput = await runGitCommand(["rev-list", "--all", "--count"]);
      const totalCommits = parseInt(countOutput[0], 10);

      const stashOutput = await runGitCommand(["stash", "list"]);
      const stashCommits = stashOutput.map(line => {
        const parts = line.split(": ");
        const stashRef = parts[0].trim();
        const message = parts.slice(1).join(": ").trim();
        return {
          hash: stashRef,
          parents: [],
          refs: [stashRef],
          message,
          author: { name: "", email: "" },
          date: new Date().toISOString(),
        };
      });

      const allCommits = [...commits, ...stashCommits];
      allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const currentBranchResult = await runGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
      const currentBranch = currentBranchResult[0] || "unknown";

      ctx.response.body = {
        commits: allCommits,
        currentBranch,
        pagination: {
          total: totalCommits + stashCommits.length,
          limit: limit || totalCommits + stashCommits.length,
          offset: offset,
          hasMore: limit !== undefined && offset + limit < totalCommits + stashCommits.length,
        },
      };
    } catch (err) {
      throw new JsonAPIError(Status.InternalServerError, err.message);
    }
  });
  // #endregion

  // #region status
  router.get("/api/v1/source-control/:instance_id/status", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const statusProcess = new Deno.Command("git", {
      args: ["status", "--porcelain"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await statusProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error: `Failed to fetch status: ${new TextDecoder().decode(stderr)}`,
      };
      return;
    }
    const statusOutput = new TextDecoder().decode(stdout);
    const statusLines = statusOutput.split("\n").filter(Boolean);
    ctx.response.body = { status: statusLines };
  });
  // #endregion

  // #region detailed diff
  router.get("/api/v1/source-control/:instance_id/detailed-diff", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const filePath = ctx.request.url.searchParams.get("file");

    if (!filePath) {
      throw new JsonAPIError(Status.BadRequest, "File path is required.");
    }

    try {
      const stagedDiffProcess = new Deno.Command("git", {
        args: ["diff", "--cached", "--", filePath],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      });
      const stagedOutput = await stagedDiffProcess.output();
      const stagedDiff = new TextDecoder().decode(stagedOutput.stdout);

      const unstagedDiffProcess = new Deno.Command("git", {
        args: ["diff", "--", filePath],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      });
      const unstagedOutput = await unstagedDiffProcess.output();
      const unstagedDiff = new TextDecoder().decode(unstagedOutput.stdout);

      ctx.response.body = {
        file: filePath,
        stagedDiff,
        unstagedDiff,
      };
    } catch (err) {
      throw new JsonAPIError(
        Status.InternalServerError,
        `Failed to fetch diff: ${err.message}`,
      );
    }
  });
  // #endregion

  // #region stage patch
  router.post("/api/v1/source-control/:instance_id/stage-patch", async ctx => {
    const BodySchema = z.object({
      file: z.string(),
      patch: z.string(),
    });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    try {
      const applyProcess = new Deno.Command("git", {
        args: ["apply", "--cached", "--unidiff-zero", "-"],
        cwd: sourceRoot,
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });

      const process = applyProcess.spawn();
      const writer = process.stdin.getWriter();
      await writer.write(new TextEncoder().encode(body.patch));
      await writer.close();

      const { code, stderr } = await process.output();
      if (code !== 0) {
        const errorMsg = new TextDecoder().decode(stderr);
        throw new Error(`Failed to apply patch: ${errorMsg}`);
      }

      ctx.response.body = {
        success: true,
        message: `Staged partial changes for ${body.file}`,
      };
    } catch (error) {
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });
  // #endregion

  // #region unstage patch
  router.post("/api/v1/source-control/:instance_id/unstage-patch", async ctx => {
    const BodySchema = z.object({
      file: z.string(),
      patch: z.string(),
    });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    try {
      const applyProcess = new Deno.Command("git", {
        args: ["apply", "--cached", "--reverse", "--unidiff-zero", "-"],
        cwd: sourceRoot,
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });

      const process = applyProcess.spawn();
      const writer = process.stdin.getWriter();
      await writer.write(new TextEncoder().encode(body.patch));
      await writer.close();

      const { code, stderr } = await process.output();
      if (code !== 0) {
        const errorMsg = new TextDecoder().decode(stderr);
        throw new Error(`Failed to unstage patch: ${errorMsg}`);
      }

      ctx.response.body = {
        success: true,
        message: `Unstaged partial changes for ${body.file}`,
      };
    } catch (error) {
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });
  // #endregion

  // #region discard patch
  router.post("/api/v1/source-control/:instance_id/discard-patch", async ctx => {
    const BodySchema = z.object({
      file: z.string(),
      patch: z.string(),
    });

    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    try {
      const applyProcess = new Deno.Command("git", {
        args: ["apply", "--reverse", "--unidiff-zero", "-"],
        cwd: sourceRoot,
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });

      const process = applyProcess.spawn();
      const writer = process.stdin.getWriter();
      await writer.write(new TextEncoder().encode(body.patch));
      await writer.close();

      const { code, stderr } = await process.output();
      if (code !== 0) {
        const errorMsg = new TextDecoder().decode(stderr);
        throw new Error(`Failed to discard patch: ${errorMsg}`);
      }

      await broadcastWorldUpdate(instance, body.file);

      ctx.response.body = {
        success: true,
        message: `Discarded partial changes for ${body.file}`,
      };
    } catch (error) {
      throw new JsonAPIError(Status.InternalServerError, error.message);
    }
  });
  // #endregion

  // #region diff
  router.get("/api/v1/source-control/:instance_id/diff", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const commitHash = ctx.request.url.searchParams.get("commit_hash");
    const diffArgs = commitHash ? ["diff", `${commitHash}^!`] : ["diff", "HEAD"];

    const diffProcess = new Deno.Command("git", {
      args: diffArgs,
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    const { code, stdout, stderr } = await diffProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error: `Failed to fetch diff: ${new TextDecoder().decode(stderr)}`,
      };
      return;
    }
    const diffOutput = new TextDecoder().decode(stdout);
    const diffs: Record<string, string> = {};
    const diffSections = diffOutput.split(/^diff --git /gm).filter(Boolean);
    for (const section of diffSections) {
      const fullSection = "diff --git " + section;
      const headerLine = fullSection.split("\n")[0];
      const match = headerLine.match(/a\/(\S+)\s+b\/\S+/);
      if (match) {
        const filePath = match[1];
        diffs[filePath] = fullSection;
      }
    }

    if (!commitHash) {
      const untrackedProcess = new Deno.Command("git", {
        args: ["ls-files", "--others", "--exclude-standard"],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      }).spawn();
      const { code: untrackedCode, stdout: untrackedStdout } = await untrackedProcess.output();
      if (untrackedCode === 0) {
        const untrackedOutput = new TextDecoder().decode(untrackedStdout).trim();
        const untrackedFiles = untrackedOutput
          ? untrackedOutput.split("\n").filter(Boolean)
          : [];
        for (const filePath of untrackedFiles) {
          if (!diffs[filePath]) {
            try {
              const fileContent = await Deno.readTextFile(path.join(sourceRoot, filePath));
              let newDiff = `diff --git a/${filePath} b/${filePath}\n`;
              newDiff += `new file mode 100644\n`;
              newDiff += `--- /dev/null\n`;
              newDiff += `+++ b/${filePath}\n`;
              const lines = fileContent.split("\n");
              if (lines[lines.length - 1] === "") {
                lines.pop();
              }
              const contentDiff = lines.map(line => `+${line}`).join("\n");
              newDiff += contentDiff;
              diffs[filePath] = newDiff;
            } catch (err) {
              console.error(`Failed to read new file ${filePath}:`, err);
            }
          }
        }
      }
    }

    ctx.response.body = { diffs };
  });
  // #endregion

  // #region list branches
  router.get("/api/v1/source-control/:instance_id/branches", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const branchProcess = new Deno.Command("git", {
      args: ["for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await branchProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error: `Failed to list branches: ${new TextDecoder().decode(stderr)}`,
      };
      return;
    }
    const branchOutput = new TextDecoder().decode(stdout);
    const branches = branchOutput
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean)
      .filter(
        b =>
          b !== "origin/HEAD" &&
          b !== "HEAD" &&
          !b.includes("->") &&
          !b.startsWith("(") &&
          !b.toLowerCase().includes("detached"),
      );
    ctx.response.body = { branches };
  });
  // #endregion

  // #region create branch
  router.post("/api/v1/source-control/:instance_id/branch/create", async ctx => {
    const BodySchema = z.object({
      branch: z.string(),
      start_point: z.string().optional(),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const args = ["branch", body.branch];
    if (body.start_point) {
      args.push(body.start_point);
    }
    const branchProcess = new Deno.Command("git", { args, cwd: sourceRoot }).spawn();
    const branchStatus = await branchProcess.status;
    if (!branchStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to create branch ${body.branch}` };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region delete branch
  router.delete("/api/v1/source-control/:instance_id/branch", async ctx => {
    const BodySchema = z.object({
      branch: z.string(),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const args = ["branch", "-D", body.branch];
    const branchProcess = new Deno.Command("git", { args, cwd: sourceRoot }).spawn();
    const branchStatus = await branchProcess.status;
    if (!branchStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to delete branch ${body.branch}` };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region list tags
  router.get("/api/v1/source-control/:instance_id/tags", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const tagProcess = new Deno.Command("git", {
      args: ["tag"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await tagProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to list tags: ${new TextDecoder().decode(stderr)}` };
      return;
    }
    const tagOutput = new TextDecoder().decode(stdout);
    const tags = tagOutput.split("\n").filter(Boolean);
    ctx.response.body = { tags };
  });
  // #endregion

  // #region create tag
  router.post("/api/v1/source-control/:instance_id/tag/create", async ctx => {
    const BodySchema = z.object({
      tag: z.string(),
      message: z.string().optional(),
      commit: z.string().optional(),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const args = ["tag"];
    if (body.message) {
      args.push("-a", body.tag, "-m", body.message);
    } else {
      args.push(body.tag);
    }
    if (body.commit) {
      args.push(body.commit);
    }
    const tagProcess = new Deno.Command("git", { args, cwd: sourceRoot }).spawn();
    const tagStatus = await tagProcess.status;
    if (!tagStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to create tag ${body.tag}` };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region delete tag
  router.delete("/api/v1/source-control/:instance_id/tag", async ctx => {
    const BodySchema = z.object({ tag: z.string() });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const tagProcess = new Deno.Command("git", {
      args: ["tag", "-d", body.tag],
      cwd: sourceRoot,
    }).spawn();
    const tagStatus = await tagProcess.status;
    if (!tagStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to delete tag ${body.tag}` };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region stash save
  router.post("/api/v1/source-control/:instance_id/stash/save", async ctx => {
    const BodySchema = z.object({ message: z.string().optional() });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const args = ["stash", "save"];
    if (body.message) {
      args.push(body.message);
    }
    const stashProcess = new Deno.Command("git", { args, cwd: sourceRoot }).spawn();
    const stashStatus = await stashProcess.status;
    if (!stashStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to stash changes" };
      return;
    }
    await broadcastWorldUpdate(instance, "project.json");
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region list stashes
  router.get("/api/v1/source-control/:instance_id/stash", async ctx => {
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const stashProcess = new Deno.Command("git", {
      args: ["stash", "list"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await stashProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error: `Failed to list stashes: ${new TextDecoder().decode(stderr)}`,
      };
      return;
    }
    const stashOutput = new TextDecoder().decode(stdout);
    const stashes = stashOutput.split("\n").filter(Boolean);
    ctx.response.body = { stashes };
  });
  // #endregion

  // #region stash pop
  router.post("/api/v1/source-control/:instance_id/stash/pop", async ctx => {
    const BodySchema = z.object({
      stash_ref: z.string().optional(),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    const stashReference =
      body.stash_ref === "stash" || body.stash_ref === "refs/stash"
        ? "stash@{0}"
        : body.stash_ref;

    const args = stashReference ? ["stash", "pop", stashReference] : ["stash", "pop"];

    const stashProcess = new Deno.Command("git", {
      args,
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    const { code, stdout, stderr } = await stashProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to pop stash: ${new TextDecoder().decode(stderr)}` };
      return;
    }

    await broadcastWorldUpdate(instance, "project.json");
    ctx.response.body = { success: true, output: new TextDecoder().decode(stdout) };
  });
  // #endregion

  // #region stash drop
  router.post("/api/v1/source-control/:instance_id/stash/drop", async ctx => {
    const BodySchema = z.object({
      stash_ref: z.string().optional(),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }

    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;

    const stashReference =
      body.stash_ref === "stash" || body.stash_ref === "refs/stash"
        ? "stash@{0}"
        : body.stash_ref;

    const args = stashReference ? ["stash", "drop", stashReference] : ["stash", "drop"];

    const stashProcess = new Deno.Command("git", {
      args,
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    const { code, stdout, stderr } = await stashProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error: `Failed to drop stash: ${new TextDecoder().decode(stderr)}`,
      };
      return;
    }
    ctx.response.body = { success: true, output: new TextDecoder().decode(stdout) };
  });
  // #endregion

  // #region reset
  router.post("/api/v1/source-control/:instance_id/reset", async ctx => {
    const BodySchema = z.object({
      mode: z.enum(["soft", "mixed", "hard"]).default("mixed"),
      commit: z.string(),
    });
    let body;
    try {
      body = BodySchema.parse(await ctx.request.body.json());
    } catch (err) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: err.toString() };
      return;
    }
    const instanceId = ctx.params.instance_id;
    if (!instanceId) {
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      throw new JsonAPIError(Status.Forbidden, "Not in edit mode.");
    }
    const sourceRoot = instance.info.worldDirectory;
    const args = ["reset", `--${body.mode}`, body.commit];
    const resetProcess = new Deno.Command("git", {
      args,
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await resetProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to reset: ${new TextDecoder().decode(stderr)}` };
      return;
    }
    await broadcastWorldUpdate(instance, "project.json");
    ctx.response.body = { success: true, output: new TextDecoder().decode(stdout) };
  });
  // #endregion
};

function stripDoubleQuotes(filePath: string): string {
  if (filePath[0] === '"' && filePath.at(-1) === '"') {
    filePath = filePath.slice(1).slice(0, -1);
  }
  return filePath;
}
