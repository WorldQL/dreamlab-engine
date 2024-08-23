import * as cli from "jsr:@std/cli@1";
import { NIL_UUID } from "jsr:@std/uuid@1/constants";
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

const args = cli.parseArgs(Deno.args, { boolean: ["start"], string: ["world"] });

await Promise.all([
  // boot instance
  (async () => {
    if (!args.start) return;
    console.log("Spawning an instance...");

    const world = args.world ?? "dreamlab/spaceship-multiplayer";

    instance = createInstance({
      instanceId: NIL_UUID,
      worldId: world,
      worldDirectory: `${Deno.cwd()}/worlds/${world}`,
      editMode: true,
      inspect: "127.0.0.1:9229",
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
