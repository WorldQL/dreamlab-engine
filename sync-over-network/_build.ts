import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleWorld,
} from "../build-system/build.ts";

if (import.meta.main) {
  await bundleEngineDependencies("../engine/", "./client/dist/vendor");
  await bundleEngine("../engine/", "./client/dist");
  await bundleClient(
    "./client",
    "./client/dist",
    [{ in: "./client/src/main.ts", out: "client-main.mjs" }],
    "./deno.json",
  );
  await bundleWorld("test-world", "./worlds/dreamlab/test-world", "./deno.json");
}
