import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.10.3";
import * as path from "jsr:@std/path@1";

export const BASE_OPTIONS: Partial<esbuild.BuildOptions> = {
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

export const dreamlabEsbuildPlugins = async (props: {
  engineExternal?: boolean;
  vendorExternal?: boolean;
  deno?: boolean;
}) => {
  const plugins = [];
  if (props.engineExternal ?? true) {
    plugins.push({
      name: "dreamlab-engine-external",
      setup: (build: esbuild.PluginBuild) => {
        build.onResolve({ filter: /^@dreamlab\/engine/ }, args => {
          return { path: args.path, external: true };
        });
      },
    });
  }
  if (props.vendorExternal ?? true) {
    plugins.push({
      name: "dreamlab-vendor-external",
      setup: (build: esbuild.PluginBuild) => {
        build.onResolve({ filter: /^@dreamlab\/vendor/ }, args => {
          return { path: args.path.replace(/\.ts$/, ".js"), external: true };
        });
      },
    });
  }
  if (props.deno ?? true) {
    plugins.push(
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath("./deno.json"),
      }),
    );
  }

  return plugins;
};

async function bundle(target: string, opts: esbuild.BuildOptions) {
  console.log(`Building ${target}...`);
  await esbuild.build(opts);
}

export async function bundleClient() {
  const opts: esbuild.BuildOptions = {
    ...BASE_OPTIONS,
    plugins: await dreamlabEsbuildPlugins({}),
    entryPoints: ["./client/src/main.ts"],
    outfile: "./client/dist/client-main.mjs",
    jsx: "automatic",
    // TODO: what needs to be external???
  };

  await bundle("client", opts);
}

export async function bundleEngine() {
  const opts: esbuild.BuildOptions = {
    ...BASE_OPTIONS,
    plugins: await dreamlabEsbuildPlugins({ engineExternal: false }),
    entryPoints: ["../engine/mod.ts"],
    outfile: "./client/dist/engine.mjs",
  };

  await bundle("engine", opts);
}

export async function bundleEngineDeps() {
  const entryPoints: string[] = [];
  for await (const entry of Deno.readDir("../engine/_deps/")) {
    if (!entry.isFile) continue;
    entryPoints.push(`../engine/_deps/${entry.name}`);
  }

  const opts: esbuild.BuildOptions = {
    ...BASE_OPTIONS,
    plugins: await dreamlabEsbuildPlugins({ engineExternal: false, vendorExternal: false }),
    entryPoints,
    outdir: "./client/dist/vendor",
    external: ["type-fest"],
  };

  await bundle("engine dependencies", opts);
}

export async function bundleWorld(worldDir: string) {
  const entryPoints: string[] = [];

  const worldDesc = JSON.parse(await Deno.readTextFile(path.join(worldDir, "./world.json")));

  for await (const entry of Deno.readDir(path.join(worldDir, "behaviors"))) {
    if (!entry.isFile) continue;
    entryPoints.push(path.join(worldDir, "behaviors", entry.name));
  }

  const opts: esbuild.BuildOptions = {
    ...BASE_OPTIONS,
    plugins: await dreamlabEsbuildPlugins({}),
    entryPoints,
    outdir: path.join(worldDir, "dist", "behaviors"),
  };

  try {
    await Deno.mkdir(path.join(worldDir, "dist"));
  } catch (err) {
    // ignore
  }
  await Deno.copyFile(
    path.join(worldDir, "world.json"),
    path.join(worldDir, "dist", "world.json"),
  );
  await bundle("world: " + worldDir, opts);
}

if (import.meta.main) {
  await bundleClient();
  await bundleEngine();
  await bundleEngineDeps();
  await bundleWorld("./worlds/dreamlab/test-world");
}
