// @deno-types="https://deno.land/x/esbuild@v0.20.1/mod.d.ts"
import * as esbuild from "https://deno.land/x/esbuild@v0.20.1/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";

const envPlugin: esbuild.Plugin = {
  name: "env",
  setup(build) {
    build.onResolve({ filter: /^(url|punycode)$/ }, ({ path }) => ({
      path: `esm.sh/v135/${path}`,
      namespace: "https",
    }));
  },
};

await esbuild.build({
  plugins: [envPlugin, ...denoPlugins({ loader: "native" })],
  entryPoints: ["./_web/main.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "./_web/main.esm.js",
  minify: true,

  banner: {
    js:
      'Symbol.dispose ??= Symbol("Symbol.dispose");\nSymbol.asyncDispose ??= Symbol("Symbol.asyncDispose");',
  },
});
