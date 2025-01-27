import * as cli from "@std/cli";
import { bundleWorld } from "../../build-system/mod.ts";

if (import.meta.main) {
  const args = cli.parseArgs(Deno.args, {
    string: ["world", "dir", "out"],
  });
  if (!args.world || !args.dir || !args.out) throw new Error("bad options");

  await bundleWorld(
    args.world,
    {
      dir: args.dir,
      denoJsonPath: "./pre-exec/deno.runtime.json",
      outDirName: args.out,
    },
    { silent: true },
  );
}
