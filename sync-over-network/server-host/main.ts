import { CONFIG } from "./config.ts";
import { Application } from "./deps/oak.ts";
import { GameInstance } from "./game-instance.ts";
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

await Promise.all([
  // boot instance
  (async () => {
    instance = new GameInstance({
      instanceId: "my-instance",
      worldId: "[world]",
      worldDirectory: "./server-runtime/worlds/test-world",
    });

    await instance.ready();
    GameInstance.INSTANCES.set(instance.info.instanceId, instance);
    console.log("Instance booted!");
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
