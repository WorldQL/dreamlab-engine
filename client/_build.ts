import * as cli from "jsr:@std/cli@1";
import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleUI,
} from "../build-system/mod.ts";

if (import.meta.main) {
  const args = cli.parseArgs(Deno.args, {
    boolean: ["watch", "clean", "wasm-b64"],
    string: ["serve-port", "out-dir", "serve-dir", "define"],
    collect: ["define"],
    default: { "serve-port": "5179", "out-dir": "./web/dist", "serve-dir": "./web" },
  });

  const out = args["out-dir"];

  if (args.clean) {
    try {
      await Deno.remove(out, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
  }

  const define: Record<string, string> = Object.fromEntries(
    args.define.map(x => x.split("=")).filter(x => x.length === 2),
  );

  await bundleEngineDependencies("../engine/", out, undefined, { unwasm: !args["wasm-b64"] });
  await bundleEngine("../engine/", out, undefined, { watch: args.watch });
  await bundleUI("../ui/", out);
  await bundleClient(
    ".",
    out,
    "./deno.json",
    [{ in: "./src/main.ts", out: "client-main" }],
    {
      watch: args.watch,
      serve: {
        host: "127.0.0.1",
        port: Number(args["serve-port"]),
        servedir: args["serve-dir"],
      },
    },
    undefined,
    define,
  );
}
