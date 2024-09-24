import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleUI,
} from "../build-system/mod.ts";

if (import.meta.main) {
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
    { watch, serve: { host: "127.0.0.1", port: 5173, servedir: "./web" } },
  );
}
