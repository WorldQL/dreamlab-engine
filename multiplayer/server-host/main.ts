import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import {
  bundleClient,
  bundleEngine,
  bundleEngineDependencies,
  bundleWorld,
} from "../../build-system/mod.ts";
import { CONFIG } from "./config.ts";
import { Application } from "./deps/oak.ts";
import { createInstance, GameInstance } from "./instance.ts";
import { setupWeb } from "./web/setup.ts";

let instance: GameInstance | undefined;

const app = new Application();
await setupWeb(app);

const webAbortController = new AbortController();

const shutdown = () => {
  console.log("Shutting down...");
  instance?.shutdown();
  webAbortController.abort();
};
Deno.addSignalListener("SIGINT", () => {
  shutdown();
  Deno.exit();
});
Deno.addSignalListener("SIGTERM", () => {
  shutdown();
  Deno.exit();
});

const TESTING_WORLD = "dreamlab/test-world";

await Promise.all([
  // boot instance
  (async () => {
    console.log("Spawning an instance...");

    instance = createInstance({
      instanceId: NIL_UUID,
      worldId: TESTING_WORLD,
      worldDirectory: `${Deno.cwd()}/worlds/${TESTING_WORLD}`,
      editMode: true,
    });

    await instance.waitForSessionBoot();
  })(),
  // listen web
  (async () => {
    const addr = CONFIG.bindAddress;
    console.log(`Listening: http://${addr.hostname}:${addr.port} ...`);
    await app.listen({
      hostname: addr.hostname,
      port: addr.port,
      signal: webAbortController.signal,
    });
  })(),
]);
