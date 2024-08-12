import { build, emptyDir } from "https://deno.land/x/dnt@0.40.0/mod.ts";

await emptyDir("./out");

await build({
  entryPoints: ["../engine/mod.ts"],
  outDir: "./out",
  shims: {
    deno: true,
  },
  declaration: "separate",
  skipSourceOutput: true,
  package: {
    name: "dreamlab-engine",
    version: "0",
    description: "",
    license: "UNLICENSED",
  },
  postBuild() {},
  compilerOptions: {
    lib: ["ESNext", "DOM"],
  },
  importMap: "../deno.json",
  test: false,
});
