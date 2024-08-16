import {
  bundleEngineDependencies,
  bundleUI,
  bundleEngine,
  bundleStyles,
  bundleClient,
} from "../build-system/mod.ts";

if (import.meta.main) {
  const watch = Deno.args.includes("--watch");

  await bundleEngineDependencies("../engine/", "./web/dist");
  await bundleEngine("../engine/", "./web/dist", undefined, { watch });
  await bundleUI("../ui/", "./web/dist");
  await bundleStyles("./web/dist", [{ in: "./client/css/main.css", out: "app" }], { watch });
  await bundleClient(
    ".",
    "./web/dist",
    "./deno.json",
    [{ in: "./client/main.ts", out: "client-main" }],
    { watch, serve: { host: "127.0.0.1", port: 5173, servedir: "./web" } },
  );
}
