import * as fs from "jsr:@std/fs@1";
import * as path from "jsr:@std/path@1";

import { esbuild } from "../../build-system/_esbuild.ts";
import { prepareBundleWorld } from "../../build-system/build-world.ts";

const dir = "./dreamlab/test-world/";

const opts = await prepareBundleWorld({
  denoJsonPath: await Deno.realPath("../deno.json"),
  dir,
  outDirName: "_dist_test",
});

// console.log(opts);

try {
  const res = await esbuild.build(opts);
  console.log(res);
} catch (err_) {
  const err = err_ as esbuild.BuildFailure;
  const failures = new Map<string, esbuild.Message[]>();
  for (const error of err.errors) {
    const _filepath = error.location?.file;
    if (!_filepath) continue;

    const filepath = path.relative(dir, _filepath);
    const messages = failures.get(filepath) ?? [];
    messages.push(error);
    failures.set(filepath, messages);
  }

  console.log(failures);

  const detourfailuresplugin: esbuild.Plugin = {
    name: "detour-failures",
    setup: build => {
      build.onLoad({ filter: /.*/ }, async args => {
        const _path = path.relative(dir, args.path);
        const messages = failures.get(_path);
        if (!messages) return undefined;

        const formatted = await esbuild.formatMessages(messages, { kind: "error" });

        const contents = `
import { Behavior } from "@dreamlab/engine";

export default class StubBehavior extends Behavior {
  private static errors = ${JSON.stringify(formatted)};
}
`.trimStart();

        return { contents, loader: "ts" };
      });
    },
  };

  opts.plugins = [detourfailuresplugin, ...(opts.plugins ?? [])];

  // // first: resolve the glob
  // const entryPoints = new Set<string>();
  // for (const glob of opts.entryPoints as string[]) {
  //   const globResults = await Array.fromAsync(fs.expandGlob(glob));
  //   for (const r of globResults) entryPoints.add(path.relative(dir, r.path));
  // }

  // // TODO: stub out the failed entry points

  // const err = err_ as esbuild.BuildFailure;
  // for (const error of err.errors) {
  //   const file = error.location?.file;
  //   if (file) entryPoints.delete(path.relative(dir, file));
  // }

  // opts.entryPoints = [...entryPoints].map(p => path.join(dir, p));

  const res = await esbuild.build(opts);
  console.log(res);
}
