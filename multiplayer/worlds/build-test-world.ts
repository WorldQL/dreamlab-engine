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
opts.write = false;

console.log(opts);

try {
  const res = await esbuild.build(opts);
  console.log(res);
} catch (err_) {
  // first: resolve the glob
  const entryPoints = new Set<string>();
  for (const glob of opts.entryPoints as string[]) {
    const globResults = await Array.fromAsync(fs.expandGlob(glob));
    for (const r of globResults) entryPoints.add(path.relative(dir, r.path));
  }

  // TODO: stub out the failed entry points

  const err = err_ as esbuild.BuildFailure;
  for (const error of err.errors) {
    const file = error.location?.file;
    if (file) entryPoints.delete(path.relative(dir, file));
  }

  opts.entryPoints = [...entryPoints].map(p => path.join(dir, p));

  const res = await esbuild.build(opts);
  console.log(res);
}
