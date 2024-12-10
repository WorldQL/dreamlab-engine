import * as cli from "jsr:@std/cli@1";
import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleUI,
} from "../build-system/mod.ts";

if (import.meta.main) {
  const args = cli.parseArgs(Deno.args, {
    boolean: ["watch", "clean"],
    string: ["serve-port"],
    default: { "serve-port": "5179" },
  });

  if (args.clean) {
    try {
      await Deno.remove("./web/dist", { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
  }

  await bundleEngineDependencies("../engine/", "./web/dist");
  await bundleEngine("../engine/", "./web/dist", undefined, { watch: args.watch });
  await bundleUI("../ui/", "./web/dist");
  await bundleClient(
    ".",
    "./web/dist",
    "./deno.json",
    [{ in: "./src/_proxy.ts", out: "client-main" }],
    {
      watch: args.watch,
      serve: { host: "127.0.0.1", port: Number(args["serve-port"]), servedir: "./web" },
    },
  );
}
