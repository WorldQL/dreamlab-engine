import { BASE_BUILD_OPTIONS, bundle, BundleOptions } from "./build-components.ts";
import {
  denoPlugins,
  dreamlabEngineExternalPlugin,
  dreamlabVendorExternalPlugin,
  esbuild,
} from "./_esbuild.ts";
import * as fs from "jsr:@std/fs@1";
import * as path from "jsr:@std/path@1";

import { copy as esbuildCopy } from "npm:esbuild-plugin-copy@2.1.1";

export interface WorldBuildOptions {
  dir: string;
  // TODO: let people supply their own import map (craft a deno.json at runtime?)
  denoJsonPath: string;
}

export const prepareBundleWorld = async (
  worldOpts: WorldBuildOptions,
  opts?: BundleOptions,
): Promise<esbuild.BuildOptions> => {
  await fs.ensureDir(path.join(worldOpts.dir, "src"));
  await fs.ensureDir(path.join(worldOpts.dir, "assets"));
  await fs.emptyDir(path.join(worldOpts.dir, "_dist"));

  // const worldDesc = JSON.parse(await Deno.readTextFile(path.join(worldDir, "./world.json")));
  // TODO: use worldDesc to figure out metadata

  const src = path.join(worldOpts.dir, "src");
  const entryPoints: esbuild.BuildOptions["entryPoints"] = [
    `${src}/**/*.ts`,
    `${src}/**/*.js`,
    `${src}/**/*.tsx`,
    `${src}/**/*.jsx`,
  ];

  // TEMP
  // @ts-expect-error esbuild moment
  entryPoints.push({
    in: path.join(worldOpts.dir, "temp-client-main.ts"),
    out: "temp-client-main",
  });
  // @ts-expect-error esbuild moment
  entryPoints.push({
    in: path.join(worldOpts.dir, "temp-server-main.ts"),
    out: "temp-server-main",
  });

  const buildOpts: esbuild.BuildOptions = {
    ...BASE_BUILD_OPTIONS,
    plugins: [
      dreamlabEngineExternalPlugin(),
      dreamlabVendorExternalPlugin(),
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath(worldOpts.denoJsonPath),
      }),
      esbuildCopy({
        resolveFrom: "cwd",
        assets: {
          from: [path.join(worldOpts.dir, "assets") + "/*"],
          to: path.join(worldOpts.dir, "_dist", "assets"),
        },
        watch: opts?.watch ?? false,
      }),
    ],
    entryPoints,
    outbase: worldOpts.dir,
    outdir: path.join(worldOpts.dir, "_dist"),
    logOverride: { "empty-glob": "silent" },
  };

  return buildOpts;
};

/**
 * Bundles a world into its '_dist' folder.
 * Requires `@dreamlab/engine` and `@dreamlab/vendor` to be present in the import map at runtime.
 */
export const bundleWorld = async (
  worldName: string,
  worldOpts: WorldBuildOptions,
  opts?: BundleOptions,
) => {
  const buildOpts = await prepareBundleWorld(worldOpts, opts);
  await bundle(`world ${worldName}`, buildOpts, opts);
};
