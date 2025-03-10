import * as path from "jsr:@std/path@^1";
import {
  denoPlugins,
  dreamlabCssPlugin,
  dreamlabEngineExternalPlugin,
  dreamlabEnvironmentPlugin,
  dreamlabNodeShimPlugin,
  dreamlabTextImportPlugin,
  dreamlabUIExternalPlugin,
  dreamlabVendorExternalPlugin,
  esbuild,
  unwasmRapierPlugin,
} from "./_esbuild.ts";

export interface BundleOptions {
  watch?: boolean;
  serve?: esbuild.ServeOptions;
  silent?: boolean;
}

export const bundle = async (
  target: string,
  esbuildOpts: esbuild.BuildOptions,
  opts: BundleOptions = {},
) => {
  if (opts.watch) {
    const ctx = await esbuild.context(
      opts.serve
        ? { ...esbuildOpts, define: { ...esbuildOpts.define, LIVE_RELOAD: "true" } }
        : esbuildOpts,
    );

    if (!opts.silent) console.log(`Watching ${target}...`);
    await ctx.watch();

    if (opts.serve) {
      const { host, port } = await ctx.serve(opts.serve);
      console.log(`Dev server started at http://${host}:${port}`);
    }
  } else {
    if (!opts.silent) console.log(`Building ${target}...`);
    await esbuild.build(esbuildOpts);
  }
};

export const BASE_BUILD_OPTIONS: Partial<esbuild.BuildOptions> = {
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: false,
  footer: { js: "// built with <3 using dreamlab ^-^" },
  sourcemap: "linked",
  keepNames: true,
  splitting: true,
};

export const EXTRA_ENTRYPOINT_BUILD_OPTIONS: Partial<esbuild.BuildOptions> = {
  banner: {
    js: `// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");`,
  },
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
    minify: true,
    plugins: [
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath(denoJsonPath),
      }),
      // FIXME: disable this if doing discord stuff
      unwasmRapierPlugin(),
    ],
    entryPoints,
    outdir: path.join(outdir, "vendor"),
    external: ["type-fest"],
    loader: { ".wasm": "file" },
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
  forDeno?: boolean,
) => {
  const buildOpts: esbuild.BuildOptions = {
    ...BASE_BUILD_OPTIONS,
    ...EXTRA_ENTRYPOINT_BUILD_OPTIONS,
    plugins: [
      dreamlabNodeShimPlugin(),
      dreamlabVendorExternalPlugin(forDeno),
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
export const bundleUI = async (
  uiDir: string,
  outdir: string,
  denoJsonPath: string = "./deno.json",
  opts?: BundleOptions,
) => {
  const buildOpts: esbuild.BuildOptions = {
    ...BASE_BUILD_OPTIONS,
    plugins: [
      dreamlabVendorExternalPlugin(),
      dreamlabUIExternalPlugin(),
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath(denoJsonPath),
      }),
    ],
    entryPoints: [
      { in: path.join(uiDir, "mod.ts"), out: "ui" },
      { in: path.join(uiDir, "jsx.ts"), out: "ui-jsx" },
    ],
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
  env?: Record<string, string>,
) => {
  // only load `.env.production` on non-watch builds
  const envStack = opts?.watch
    ? [".env", ".env.local"]
    : [".env", ".env.production", ".env.local"];

  const buildOpts: esbuild.BuildOptions = {
    ...BASE_BUILD_OPTIONS,
    ...EXTRA_ENTRYPOINT_BUILD_OPTIONS,
    plugins: [
      dreamlabCssPlugin(),
      dreamlabNodeShimPlugin(),
      dreamlabTextImportPlugin(".svg"),
      dreamlabEnvironmentPlugin(
        envStack.map(it => path.join(clientDir, it)),
        env,
      ),
      dreamlabVendorExternalPlugin(),
      dreamlabEngineExternalPlugin(),
      dreamlabUIExternalPlugin(),
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath(denoJsonPath),
      }),
    ],
    jsx: "automatic",
    jsxImportSource: "@dreamlab/ui",
    entryPoints: inputs,
    outdir,
  };

  await bundle("client", buildOpts, opts);
};
