import {
  esbuild,
  denoPlugins,
  dreamlabVendorExternalPlugin,
  dreamlabEngineExternalPlugin,
  dreamlabUiExternalPlugin,
} from "./_esbuild.ts";
import * as path from "jsr:@std/path@^1";

export interface BundleOptions {
  watch: boolean;
  serve?: esbuild.ServeOptions;
}

export const bundle = async (
  target: string,
  esbuildOpts: esbuild.BuildOptions,
  opts: BundleOptions = { watch: false },
) => {
  if (opts.watch) {
    const ctx = await esbuild.context(
      opts.serve
        ? { ...esbuildOpts, define: { ...esbuildOpts.define, LIVE_RELOAD: "true" } }
        : esbuildOpts,
    );

    console.log(`Watching ${target}...`);
    await ctx.watch();

    if (opts.serve) {
      const { host, port } = await ctx.serve(opts.serve);
      console.log(`Dev server started at http://${host}:${port}`);
    }
  } else {
    console.log(`Building ${target}…`);
    await esbuild.build(esbuildOpts);
  }
};

export const BASE_BUILD_OPTIONS: Partial<esbuild.BuildOptions> = {
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: false,
  banner: {
    js: `// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");`,
  },
  sourcemap: "linked",
  keepNames: true,
  splitting: true,
};

/**
 *
 */
export const bundleEngineDependencies = async (
  engineDir: string,
  outdir: string,
  denoJsonPath: string = path.join(engineDir, "deno.json"),
  opts?: BundleOptions,
) => {
  const vendorDir = path.join(engineDir, "_deps");
  const entryPoints: string[] = [];
  for await (const entry of Deno.readDir(vendorDir)) {
    if (!entry.isFile) continue;
    entryPoints.push(`${vendorDir}/${entry.name}`);
  }

  const buildOpts: esbuild.BuildOptions = {
    ...BASE_BUILD_OPTIONS,
    plugins: [
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath(denoJsonPath),
      }),
    ],
    entryPoints,
    outdir: path.join(outdir, "vendor"),
    external: ["type-fest"],
  };

  await bundle("engine dependencies", buildOpts, opts);
};

/**
 * Bundles the engine into an 'engine.js' ES Module in the outdir.
 * This will include external references to "@dreamlab/vendor", so map imports accordingly.
 */
export const bundleEngine = async (
  engineDir: string,
  outdir: string,
  denoJsonPath: string = "./deno.json",
  opts?: BundleOptions,
) => {
  const buildOpts: esbuild.BuildOptions = {
    ...BASE_BUILD_OPTIONS,
    plugins: [
      dreamlabEngineExternalPlugin(),
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath(denoJsonPath),
      }),
    ],
    entryPoints: [{ in: path.join(engineDir, "mod.ts"), out: "engine" }],
    outdir,
  };

  await bundle("engine", buildOpts, opts);
};

/**
 *
 */
export const bundleUi = async (
  engineDir: string,
  outdir: string,
  denoJsonPath: string = "./deno.json",
  opts?: BundleOptions,
) => {
  const buildOpts: esbuild.BuildOptions = {
    ...BASE_BUILD_OPTIONS,
    plugins: [
      dreamlabUiExternalPlugin(),
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath(denoJsonPath),
      }),
    ],
    entryPoints: [{ in: path.join(engineDir, "mod.ts"), out: "ui" }],
    outdir,
  };

  await bundle("ui", buildOpts, opts);
};

/**
 * Bundles the "client" into one ES Module
 */
export const bundleClient = async (
  clientDir: string,
  outdir: string,
  denoJsonPath: string = path.join(clientDir, "deno.json"),
  inputs: esbuild.BuildOptions["entryPoints"] = [
    { in: path.join(clientDir, "src", "main.ts"), out: "client-main" },
  ],
  opts?: BundleOptions,
) => {
  const buildOpts: esbuild.BuildOptions = {
    ...BASE_BUILD_OPTIONS,
    plugins: [
      dreamlabEngineExternalPlugin(),
      dreamlabVendorExternalPlugin(),
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath(denoJsonPath),
      }),
    ],
    jsx: "automatic",
    entryPoints: inputs,
    outdir,
  };

  await bundle("client", buildOpts, opts);
};
