import * as cli from "jsr:@std/cli@1";
import { bundleWorld } from "../../build-system/mod.ts";

if (import.meta.main) {
  const args = cli.parseArgs(Deno.args, {
    string: ["world", "dir", "out"],
  });
  if (!args.world || !args.dir || !args.out) throw new Error("bad options");

  await bundleWorld(args.world, {
    dir: args.dir,
    denoJsonPath: "./deno.json",
    outDirName: args.out,
  });
}
