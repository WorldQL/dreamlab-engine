import * as path from "@std/path";
import * as fs from "@std/fs";

import env from "../util/env.ts";

import { bundleWorld } from "../../../build-system/mod.ts";

import { RunningInstance } from "./mod.ts";

export const fetchWorld = async (
  instance: RunningInstance,
  worldId: string,
  worldDirectory: string,
) => {
  const revision = instance.worldRevision;

  const checkout = async () => {
    const checkoutProcess = new Deno.Command("git", {
      args: ["checkout", revision ?? "origin/main"],
    }).spawn();
    await checkoutProcess.status;
  };

  if (!(await fs.exists(worldDirectory))) {
    instance.logs.info(`Fetching world '${worldId}' ...`);
    const gitBase =
      env("DIST_SERVER_URL", env.optional) ?? "https://distribution.dreamlab.gg/v1";
    const gitUrl = `${gitBase}/git/${worldId}.git`;
    const cloneProcess = new Deno.Command("git", {
      args: ["clone", gitUrl, worldDirectory],
    }).spawn();
    await cloneProcess.status;

    await checkout();
  } else if (await fs.exists(path.join(worldDirectory, ".git"))) {
    instance.logs.info(`Updating world '${worldId}' ...`);

    const pullProcess = new Deno.Command("git", {
      args: ["pull", "--rebase"],
      cwd: worldDirectory,
    }).spawn();
    const pullStatus = await pullProcess.status;

    if (!pullStatus.success) {
      instance.logs.warn("Failed to pull latest changes. Resetting to track remote.");

      const resetProcess = new Deno.Command("git", {
        args: ["reset", "--hard", "origin/main"],
        cwd: worldDirectory,
      }).spawn();
      await resetProcess.status;
    }

    checkout();
  } else {
    instance.logs.info(`Skipping world update (world exists without .git directory)`);
  }
};

export interface WorldBuildOptions {
  discord?: boolean;
}

export const buildWorld = async (
  instance: RunningInstance,
  worldDirectory: string,
  _opts: WorldBuildOptions,
) => {
  // TODO: do we need to do the funny custom esbuild service thing again? are we good?

  // maybe we should run these in a separate worker so that if the process crashes
  // we don't take down literally everybody's game at the same time

  instance.logs.info("Building world...");

  // TODO: do we need to do anything special about opts.discord ? we were before
  await bundleWorld(instance.worldId, { dir: worldDirectory, denoJsonPath: "./deno.json" });
};
