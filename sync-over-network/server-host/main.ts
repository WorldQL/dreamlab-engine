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
  // instance?.shutdown();
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

await Promise.all([
  // boot instance
  (async () => {
    // TODO: bootInstance(..) function
    instance = createInstance({
      instanceId: "my-instance",
      worldId: "dreamlab/test-world",
      worldDirectory: `${Deno.cwd()}/worlds/dreamlab/test-world`,
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
