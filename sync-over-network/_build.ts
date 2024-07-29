import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleWorld,
} from "../build-system/mod.ts";

if (import.meta.main) {
  await bundleEngineDependencies("../engine/", "./client/dist");
  await bundleEngine("../engine/", "./client/dist");
  await bundleClient("./client", "./client/dist", "./deno.json");
  await bundleWorld(
    "test-world",
    { dir: "./worlds/dreamlab/test-world", denoJsonPath: "./deno.json" },
    { watch: Deno.args.includes("--watch") },
  );
}
