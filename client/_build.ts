import * as esbuild from "npm:esbuild@0.20.2";

import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

const BASE_OPTIONS: Partial<esbuild.BuildOptions> = {
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
};

async function bundle(
  target: string,
  opts: esbuild.BuildOptions,
  watch: boolean,
  serve: boolean,
) {
  if (watch) {
    const ctx = await esbuild.context(
      serve ? { ...opts, define: { ...opts.define, LIVE_RELOAD: "true" } } : opts,
    );

    console.log(`Watching ${target}...`);
    await ctx.watch();

    if (serve) {
      const { port } = await ctx.serve({ servedir: "./web", port: 5173 });
      console.log(`Dev server started at http://localhost:${port}`);
    }
  } else {
    console.log(`Building ${target}...`);
    await esbuild.build(opts);
  }
}

export async function bundleClient(watch: boolean = false) {
  const opts: esbuild.BuildOptions = {
    ...BASE_OPTIONS,
    plugins: [
      {
        name: "dreamlab-engine-external",
        setup: (build: esbuild.PluginBuild) => {
          build.onResolve({ filter: /^@dreamlab\/engine/ }, args => {
            return { path: args.path, external: true };
          });
        },
      },
      {
        name: "dreamlab-vendor-external",
        setup: (build: esbuild.PluginBuild) => {
          build.onResolve({ filter: /^@dreamlab\/vendor/ }, args => {
            return { path: args.path.replace(/\.ts$/, ".js"), external: true };
          });
        },
      },
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath("./deno.json"),
      }),
    ],
    entryPoints: ["./src/main.ts"],
    outfile: "./web/dist/client-main.mjs",
    jsx: "automatic",
    external: ["https://*"],
  };

  await bundle("client", opts, watch, watch);
}

export async function bundleEngine(watch: boolean = false) {
  const opts: esbuild.BuildOptions = {
    ...BASE_OPTIONS,
    plugins: [
      {
        name: "dreamlab-vendor-external",
        setup: (build: esbuild.PluginBuild) => {
          build.onResolve({ filter: /^@dreamlab\/vendor/ }, args => {
            return { path: args.path.replace(/\.ts$/, ".js"), external: true };
          });
        },
      },
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath("../engine/deno.json"),
      }),
    ],
    entryPoints: ["../engine/mod.ts"],
    outfile: "./web/dist/engine.mjs",
  };

  await bundle("engine", opts, watch, false);
}

export async function bundleEngineDeps() {
  const entryPoints: string[] = [];
  for await (const entry of Deno.readDir("../engine/_deps/")) {
    if (!entry.isFile) continue;
    entryPoints.push(`../engine/_deps/${entry.name}`);
  }

  const opts: esbuild.BuildOptions = {
    ...BASE_OPTIONS,
    plugins: [
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath("../engine/deno.json"),
      }),
    ],
    entryPoints,
    outdir: "./web/dist/vendor",
    external: ["type-fest"],
  };

  await bundle("engine dependencies", opts, false, false);
}

if (import.meta.main) {
  const watch = Deno.args.includes("--watch");

  await bundleEngineDeps();
  await bundleEngine(watch);
  await bundleClient(watch);
}
