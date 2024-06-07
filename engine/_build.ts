import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

export const buildVendor = async (outdir: string = "./_out/vendor/") => {
  const entryPoints = [];
  for await (const entry of Deno.readDir("./_deps")) {
    if (entry.isFile) entryPoints.push("./_deps/" + entry.name);
  }

  await esbuild.build({
    plugins: [
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath("./deno.json"),
        lockPath: await Deno.realPath("./deno.lock"),
      }),
    ],
    entryPoints,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    outdir,
    minify: true,
  });
};

export const buildEngine = async (
  outfile: string = "./_out/engine.bundled.mjs"
) => {
  await esbuild.build({
    plugins: [
      {
        name: "vendor-external",
        setup: (build: esbuild.PluginBuild) => {
          build.onResolve({ filter: /^@dreamlab\/vendor/ }, (args) => {
            return { path: args.path.replace(/\.ts$/, ".js"), external: true };
          });
        },
      },
      ...denoPlugins({
        loader: "native",
        configPath: await Deno.realPath("./deno.json"),
        lockPath: await Deno.realPath("./deno.lock"),
      }),
    ],
    entryPoints: ["./mod.ts"],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    outfile,
    minify: false,
    banner: {
      js: 'Symbol.dispose ??= Symbol.for("Symbol.dispose");\nSymbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");',
    },
  });
};

if (import.meta.main) {
  await buildEngine();
  await buildVendor();
}
