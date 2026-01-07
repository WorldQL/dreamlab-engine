import { GameInstance } from "./instance.ts";

import * as fs from "@std/fs";
import * as path from "@std/path";
import { CONFIG } from "./config.ts";

export const fetchWorld = async (instance: GameInstance) => {
  // TODO: dont fetch the world if it's an edit session with uncommitted changes..

  const world = instance.info.gitId ?? instance.info.worldId;
  const revision = instance.info.worldRevision ?? "main";
  const dir = instance.info.worldDirectory;

  if (world.startsWith("external/") || !dir.startsWith(CONFIG.WORLDS_DIRECTORY)) {
    instance.logs.debug("Skipping world update (external world directory)");
    return;
  }

  if (!(await fs.exists(dir))) {
    instance.logs.debug("Fetching world", { world, revision });
    await fs.ensureDir(path.dirname(dir));

    const distributionUrl = CONFIG.DISTRIBUTION_PUBLIC_URL.endsWith("/git")
      ? CONFIG.DISTRIBUTION_PUBLIC_URL
      : `${CONFIG.DISTRIBUTION_PUBLIC_URL}/git`;

    const cloneProcess = new Deno.Command("git", {
      args: ["clone", `${distributionUrl}/${world}.git`, dir],
    }).spawn();

    await cloneProcess.status;

    const checkoutProcess = new Deno.Command("git", {
      args: ["checkout", revision],
      cwd: dir,
    }).spawn();
    await checkoutProcess.status;
  } else if (await fs.exists(path.join(dir, ".git"))) {
    if (instance.info.worldId.startsWith("u_test/")) return;

    instance.logs.debug("Updating world", { world, revision });

    const pullProcess = new Deno.Command("git", {
      args: ["pull", "--rebase"],
      cwd: dir,
    }).spawn();
    const pullStatus = await pullProcess.status;

    if (!pullStatus.success) {
      // TODO: we probably don't want to throw away in-flight edits if we're updating an edit instance's world

      instance.logs.warn("Failed to pull latest changes. Keeping current working state.", {
        exitCode: pullStatus.code,
      });

      // const resetProcess = new Deno.Command("git", {
      //   args: ["reset", "--hard", "origin/main"],
      //   cwd: dir,
      // }).spawn();
      // await resetProcess.status;
    }

    const checkoutProcess = new Deno.Command("git", {
      args: ["checkout", revision],
      cwd: dir,
    }).spawn();
    await checkoutProcess.status;
  } else {
    instance.logs.debug("Skipping world update (world exists without .git directory)");
  }
};
