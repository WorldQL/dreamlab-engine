import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.10.3";
export { esbuild, denoPlugins };

export const dreamlabEngineExternalPlugin = (): esbuild.Plugin => ({
  name: "dreamlab-engine-external",
  setup: (build: esbuild.PluginBuild) => {
    build.onResolve({ filter: /^@dreamlab\/engine/ }, args => {
      return { path: args.path, external: true };
    });
  },
});

export const dreamlabVendorExternalPlugin = (): esbuild.Plugin => ({
  name: "dreamlab-vendor-external",
  setup: (build: esbuild.PluginBuild) => {
    build.onResolve({ filter: /^@dreamlab\/vendor/ }, args => {
      return { path: args.path.replace(/\.ts$/, ".js"), external: true };
    });
  },
});
