import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

await esbuild.build({
  plugins: [
    ...denoPlugins({
      loader: "native",
      configPath: await Deno.realPath("./deno.json"),
    }),
  ],
  entryPoints: ["./_web/main.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "./_web/main.esm.js",
  minify: false,

  banner: {
    js: 'Symbol.dispose ??= Symbol("Symbol.dispose");\nSymbol.asyncDispose ??= Symbol("Symbol.asyncDispose");',
  },
});
