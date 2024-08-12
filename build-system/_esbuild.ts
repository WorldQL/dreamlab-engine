import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.10.3";
export { esbuild, denoPlugins };

import * as path from "jsr:@std/path@^1";

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

// TODO: what do we actually want here?
export const dreamlabDataLoaderPlugin = (worldDir: string): esbuild.Plugin => ({
  name: "dreamlab-data-loader",
  setup(build) {
    build.onResolve({ filter: /.(css|html)$/i }, args => {
      const pathRel = path.relative(worldDir, path.join(args.resolveDir, args.path));
      if (pathRel.startsWith("../"))
        throw new Error("Attempted to import resource from outside world directory");
      return {
        path: pathRel,
        namespace: "dreamlab-data-loader",
        pluginData: "text",
      };
    });
    build.onResolve({ filter: /.(png|jpg|jpeg|webp)$/i }, args => {
      const pathRel = path.relative(worldDir, path.join(args.resolveDir, args.path));
      if (pathRel.startsWith("../"))
        throw new Error("Attempted to import resource from outside world directory");
      return {
        path: pathRel,
        namespace: "dreamlab-data-loader",
        pluginData: "dataurl",
      };
    });
    build.onLoad(
      {
        filter: /.*/,
        namespace: "dreamlab-data-loader",
      },
      async args => ({
        contents: await Deno.readTextFile(path.join(worldDir, args.path)),
        loader: args.pluginData as esbuild.Loader,
      }),
    );
  },
});
