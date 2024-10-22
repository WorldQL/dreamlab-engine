import * as dotenv from "jsr:@std/dotenv@0.225.2";
import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleUI,
} from "../build-system/mod.ts";

if (import.meta.main) {
  dotenv.load({ envPath: "./.env.local", export: true });

  const watch = Deno.args.includes("--watch");
  const clean = Deno.args.includes("--clean");

  if (clean) {
    try {
      await Deno.remove("./web/dist", { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
  }

  await bundleEngineDependencies("../engine/", "./web/dist");
  await bundleEngine("../engine/", "./web/dist", undefined, { watch });
  await bundleUI("../ui/", "./web/dist");
  await bundleClient(
    ".",
    "./web/dist",
    "./deno.json",
    [{ in: "./src/main.ts", out: "client-main" }],
    { watch, serve: { host: "127.0.0.1", port: 5179, servedir: "./web" } },
  );
}
