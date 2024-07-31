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
  // build the client. why not
  async () => {
    await bundleEngineDependencies("../engine/", "./client/dist");
    await bundleEngine("../engine/", "./client/dist");
    await bundleClient("./client", "./client/dist", "./deno.json");
    await bundleWorld("test-world", {
      dir: `./worlds/${TESTING_WORLD}`,
      denoJsonPath: "./deno.json",
    });
  },
  // boot instance
  (async () => {
    instance = createInstance({
      instanceId: "my-instance",
      worldId: TESTING_WORLD,
      worldDirectory: `${Deno.cwd()}/worlds/${TESTING_WORLD}`,
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
