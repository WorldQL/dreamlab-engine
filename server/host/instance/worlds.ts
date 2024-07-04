import * as path from "@std/path";
import * as fs from "@std/fs";

import env from "../util/env.ts";

import { denoPlugins, type DenoPluginsOptions } from "jsr:@luca/esbuild-deno-loader@^0.10.3";

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
  opts: WorldBuildOptions,
) => {
  // instance.logs.info("Building client bundle...")
  // let entryPoint: string | undefined
  // for (const candidate of ["client.ts", "client.js"]) {
  //   if (await fs.exists(path.join(worldDirectory, candidate))) {
  //     entryPoint = candidate
  //     break
  //   }
  // }
  // const esbuildService = await esbuild.startService()
  // const plugins: esbuild.Plugin[] = []
  // if (opts.discord) {
  //   plugins.push({
  //     name: "discord-rewrite",
  //     setup: (build: esbuild.PluginBuild) => {
  //       build.onResolve({ filter: /^https:\/\/esm\.sh/ }, args => {
  //         return { path: args.path.replace("https://esm.sh/", "/esm/"), external: true }
  //       })
  //     }
  //   })
  // }
  // plugins.push({
  //   name: "dreamlab-data-loader",
  //   setup(build) {
  //     build.onResolve({ filter: /.(css|html)$/i }, args => {
  //       const pathRel = path.relative(worldDirectory, path.join(args.resolveDir, args.path))
  //       if (pathRel.startsWith("../"))
  //         throw new Error("Attempted to import resource from outside world directory")
  //       return {
  //         path: pathRel,
  //         namespace: "dreamlab-data-loader",
  //         pluginData: "text"
  //       }
  //     })
  //     build.onResolve({ filter: /.(png|jpg|jpeg|webp)$/i }, args => {
  //       const pathRel = path.relative(worldDirectory, path.join(args.resolveDir, args.path))
  //       if (pathRel.startsWith("../"))
  //         throw new Error("Attempted to import resource from outside world directory")
  //       return {
  //         path: pathRel,
  //         namespace: "dreamlab-data-loader",
  //         pluginData: "dataurl"
  //       }
  //     })
  //     build.onLoad(
  //       {
  //         filter: /.*/,
  //         namespace: "dreamlab-data-loader"
  //       },
  //       async args => ({
  //         contents: await Deno.readTextFile(path.join(worldDirectory, args.path)),
  //         loader: args.pluginData as esbuild.Loader
  //       })
  //     )
  //   }
  // })
  // plugins.push(
  //   ...denoPlugins({
  //     loader: "native",
  //     configPath: path.join(Deno.cwd(), "esbuild-deno.json"),
  //     nodeModulesDir: true
  //   })
  // )
  // await esbuildService.build({
  //   plugins,
  //   format: "esm",
  //   platform: "browser",
  //   target: "esnext",
  //   jsx: "automatic",
  //   jsxImportSource: "react",
  //   entryPoints: [path.join(worldDirectory, entryPoint ?? "client.ts")],
  //   bundle: true,
  //   external: [
  //     "@dreamlab.gg/core",
  //     "matter-js",
  //     "pixi.js",
  //     "zod",
  //     "@dreamlab.gg/ui",
  //     "https://esm.sh/*",
  //     "react"
  //   ],
  //   outfile: `${worldDirectory}/client.${instance.worldVariant}.bundled.js`,
  //   sourcemap: "linked"
  // })
  // await esbuildService.stop()
};
