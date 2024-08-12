import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleUi,
} from "../build-system/mod.ts";

if (import.meta.main) {
  const watch = Deno.args.includes("--watch");

  await bundleEngineDependencies("../engine/", "./web/dist");
  await bundleUi("../ui/", "./web/dist");
  await bundleEngine("../engine/", "./web/dist", undefined, { watch });
  await bundleClient(
    "../editor",
    "./web/dist",
    "./deno.json",
    [{ in: "./src/main.ts", out: "client-main" }],
    { watch },
  );
}
