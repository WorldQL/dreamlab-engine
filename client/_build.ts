import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleUI,
} from "../build-system/mod.ts";

if (import.meta.main) {
  const watch = Deno.args.includes("--watch");

  await bundleEngineDependencies("../engine/", "./web/dist");
  await bundleUI("../ui/", "./web/dist");
  await bundleEngine("../engine/", "./web/dist", undefined, { watch });
  await bundleClient(
    "../client",
    "./web/dist",
    "./deno.json",
    [{ in: "./src/main.ts", out: "client-main" }],
    { watch, serve: { host: "127.0.0.1", port: 5173, servedir: "./web" } },
  );
}
