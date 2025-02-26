import { z } from "@dreamlab/vendor/zod.ts";
import { Router, Status } from "@oak/oak";
import * as path from "@std/path";
import { buildWorld } from "../../../server-common/world-build.ts";
import { fileIsProbablyBehaviorScript } from "../../../../build-system/build-world.ts";
import { GameInstance } from "../../instance.ts";
import { JsonAPIError } from "../../../common-host/web-util/api.ts";

export const serveSourceControlAPI = (router: Router) => {
  async function broadcastWorldUpdate(filePath?: string) {
    await buildWorld("default", Deno.cwd(), "_dist");

    if (filePath) {
      const absolutePath = path.join(Deno.cwd(), filePath);
      const isBehavior = await fileIsProbablyBehaviorScript(absolutePath);
      const packet = {
        t: "ScriptEdited",
        script_location: filePath,
        behavior_script_id: isBehavior
          ? `res://${filePath.replace(/\.tsx?$/, ".js")}`
          : undefined,
      };
      console.log("Broadcasting packet:", packet);
    } else {
      const packet = {
        t: "WorldUpdated",
        message: "Working branch code has been updated.",
      };
      console.log("Broadcasting packet:", packet);
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

  // #region push changes
  router.post("/api/v1/source-control/:instance_id/push", async ctx => {
    const BodySchema = z.object({
      remote: z.string().optional().default("origin"),
      branch: z.string().optional().default("main"),
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
    const pushProcess = new Deno.Command("git", {
      args: ["push", body.remote, body.branch],
      cwd: sourceRoot,
    }).spawn();
    const pushStatus = await pushProcess.status;
    if (!pushStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to push" };
      return;
    }
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region pull changes
  router.post("/api/v1/source-control/:instance_id/pull", async ctx => {
    const BodySchema = z.object({
      remote: z.string().optional().default("origin"),
      branch: z.string().optional().default("main"),
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
    const pullProcess = new Deno.Command("git", {
      args: ["pull", body.remote, body.branch],
      cwd: sourceRoot,
    }).spawn();
    const pullStatus = await pullProcess.status;
    if (!pullStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Failed to pull" };
      return;
    }
    await broadcastWorldUpdate();
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region stage a file
  router.put("/api/v1/source-control/:instance_id/stage", async ctx => {
    const BodySchema = z.object({ file: z.string() });
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
    const addProcess = new Deno.Command("git", {
      args: ["add", body.file],
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
    const BodySchema = z.object({ file: z.string() });
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
    const resetProcess = new Deno.Command("git", {
      args: ["reset", "HEAD", body.file],
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

    console.log(`Switching to branch: ${branch}`);

    const checkoutProcess = new Deno.Command("git", {
      args: checkoutArgs,
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stderr } = await checkoutProcess.output();

    if (code !== 0) {
      const errorMsg = new TextDecoder().decode(stderr);
      console.log(`Failed to checkout branch: ${branch} - ${errorMsg}`);
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: errorMsg.trim() };
      return;
    }

    await broadcastWorldUpdate();
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
      args: ["checkout", body.commit_hash],
      cwd: sourceRoot,
    }).spawn();
    const checkoutStatus = await checkoutProcess.status;
    if (!checkoutStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to checkout commit ${body.commit_hash}` };
      return;
    }
    await broadcastWorldUpdate();
    ctx.response.body = { success: true };
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
      args: ["revert", body.commit_hash],
      cwd: sourceRoot,
    }).spawn();
    const revertStatus = await revertProcess.status;
    if (!revertStatus.success) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to revert commit ${body.commit_hash}` };
      return;
    }
    await broadcastWorldUpdate();
    ctx.response.body = { success: true };
  });
  // #endregion

  // #region merge branches
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
      args: ["merge", body.source],
      cwd: sourceRoot,
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
      const conflictStdout = new TextDecoder().decode(conflictOutput.stdout);
      const conflictFiles = conflictStdout.split("\n").filter(Boolean);
      const conflicts = [];
      for (const file of conflictFiles) {
        try {
          const fileContent = await Deno.readTextFile(path.join(sourceRoot, file));
          conflicts.push({ filePath: file, content: fileContent });
        } catch (_err) {
          // Skip
        }
      }
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error: `Merge conflicts detected when merging branch ${body.source} into ${body.target}`,
        conflicts,
      };
      return;
    }
    await broadcastWorldUpdate();
    ctx.response.body = { success: true };
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
    const branchToRebaseOnto = `${body.remote}/${body.baseBranch}`;

    const rebaseProcess = new Deno.Command("git", {
      args: ["rebase", branchToRebaseOnto],
      cwd: sourceRoot,
    }).spawn();

    const rebaseStatus = await rebaseProcess.status;
    if (!rebaseStatus.success) {
      const conflictProcess = new Deno.Command("git", {
        args: ["diff", "--name-only", "--diff-filter=U"],
        cwd: sourceRoot,
        stdout: "piped",
        stderr: "piped",
      }).spawn();
      const conflictOutput = await conflictProcess.output();
      const conflictStdout = new TextDecoder().decode(conflictOutput.stdout);
      const conflictFiles = conflictStdout.split("\n").filter(Boolean);
      const conflicts = [];
      for (const file of conflictFiles) {
        try {
          const fileContent = await Deno.readTextFile(path.join(sourceRoot, file));
          conflicts.push({ filePath: file, content: fileContent });
        } catch (_err) {
          // Skip
        }
      }
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error: `Rebase conflicts detected when rebasing onto ${branchToRebaseOnto}`,
        conflicts,
      };
      return;
    }
    await buildWorld("default", Deno.cwd(), "_dist");
    ctx.response.body = { success: true };
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
        args: ["add", body.file],
        cwd: sourceRoot,
      }).spawn();
      const addStatus = await addProcess.status;
      if (!addStatus.success) {
        throw new Error("Failed to mark file as resolved.");
      }

      const continueProcess = new Deno.Command("git", {
        args: ["merge", "--continue"],
        cwd: sourceRoot,
      }).spawn();
      const continueStatus = await continueProcess.status;
      if (!continueStatus.success) {
        throw new Error("Failed to complete the merge after resolving conflict.");
      }

      await broadcastWorldUpdate(body.file);

      ctx.response.body = { success: true, message: `Conflict resolved for ${body.file}` };
    } catch (error) {
      throw new JsonAPIError(
        Status.InternalServerError,
        `Error resolving conflict: ${error.message}`,
      );
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
    const args = commitHash ? ["diff", `${commitHash}^!`] : ["diff", "HEAD"];

    const diffProcess = new Deno.Command("git", {
      args,
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
      args: ["branch", "-a", "--format=%(refname:short)"],
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
      .filter(Boolean)
      .map(line => line.trim())
      .filter(branch => branch !== "origin/HEAD" && !branch.includes("->"));
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
    const args = ["branch", body.force ? "-D" : "-d", body.branch];
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
      args: ["stash", "pop"],
      cwd: sourceRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await stashProcess.output();
    if (code !== 0) {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to pop stash: ${new TextDecoder().decode(stderr)}` };
      return;
    }
    ctx.response.body = { success: true, output: new TextDecoder().decode(stdout) };
  });
  // #endregion

  // #region reset
  router.post("/api/v1/source-control/:instance_id/reset", async ctx => {
    console.log("recieved reset");
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
      console.log("no id");
      throw new JsonAPIError(Status.BadRequest, "Instance ID is required.");
    }
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (!instance) {
      console.log("no found");
      throw new JsonAPIError(Status.NotFound, "Instance not found.");
    }
    if (!instance.info.editMode) {
      console.log("no edit mode");
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
    console.log("build cmd");
    const { code, stdout, stderr } = await resetProcess.output();
    if (code !== 0) {
      console.log("failed ", stdout, stderr);
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: `Failed to reset: ${new TextDecoder().decode(stderr)}` };
      return;
    }
    await broadcastWorldUpdate();
    ctx.response.body = { success: true, output: new TextDecoder().decode(stdout) };
  });
  // #endregion
};
