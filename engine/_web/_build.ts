import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";
import * as _throwaway from "./main.ts";

const opts: esbuild.BuildOptions = {
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
  outfile: "./_web/www/main.esm.js",
  minify: false,
  keepNames: true,
  sourcemap: "linked",

  banner: {
    js: 'Symbol.dispose ??= Symbol("Symbol.dispose");\nSymbol.asyncDispose ??= Symbol("Symbol.asyncDispose");',
  },
};

const dev = Deno.args[0] === "--dev";

if (dev) {
  const ctx = await esbuild.context({ ...opts, define: { ...opts.define, IS_DEV: "true" } });

  await ctx.watch();
  const { port } = await ctx.serve({ servedir: "./_web/www", port: 3000 });
  console.log(`Dev server started at http://localhost:${port}`);
} else {
  await esbuild.build({ ...opts, define: { ...opts.define, IS_DEV: "false" } });
}
