import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleUi,
  bundleWorld,
} from "../build-system/mod.ts";

if (import.meta.main) {
  await bundleEngineDependencies("../engine/", "../client/web/dist");
  await bundleUi("../ui/", "../client/web/dist");
  await bundleEngine("../engine/", "../client/web/dist");
  await bundleClient("../client", "../client/web/dist", "../client/deno.json", [
    { in: "../client/src/main.ts", out: "client-main" },
  ]);
  await bundleWorld(
    "test-world",
    { dir: "./worlds/dreamlab/test-world", denoJsonPath: "./deno.json" },
    { watch: Deno.args.includes("--watch") },
  );
}
