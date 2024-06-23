import { bundleEngineDeps, bundleEngine, bundleClient } from "../client/_build.ts";

if (import.meta.main) {
  await bundleEngineDeps();
  await bundleEngine(true);
  await bundleClient(true);
}
