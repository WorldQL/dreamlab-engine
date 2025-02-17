import { Application } from "@oak/oak";
import * as cli from "@std/cli";
import { NIL_UUID } from "@std/uuid/constants";
import { CONFIG } from "./config.ts";
import { startInstanceCollector } from "./instance-collector.ts";
import { createInstance, GameInstance } from "./instance.ts";
import { report } from "./metrics.ts";
import { setupWeb } from "./web/setup.ts";

addEventListener("unhandledrejection", event => {
  event.preventDefault();
  if (event.reason) console.error("caught potential fatal error:", event.reason);
});

let instance: GameInstance | undefined;

const app = new Application();
await setupWeb(app);

const webAbortController = new AbortController();

// report metrics every minute
const interval = setInterval(async () => {
  const jobs = [...GameInstance.INSTANCES.values()].flatMap(instance =>
    [instance.session, instance.playSession]
      .filter(it => it !== undefined)
      .map(
        async session =>
          ({ session, worker: session.ipc, metrics: await session.ipc.metrics() }) as const,
      ),
  );

  const data = await Promise.all(jobs);

  const MEMORY_THRESHOLD = 1000; // TODO: real value
  for (const { worker, metrics } of data) {
    if (metrics.memory <= MEMORY_THRESHOLD) continue;
    // TODO: gracefully terminate
  }

  await report(...data);
}, 1000 * 15);

const shutdown = () => {
  console.log("Shutting down...");
  clearInterval(interval);
  instance?.shutdown();
  webAbortController.abort();
};
Deno.addSignalListener("SIGINT", () => {
  shutdown();
  Deno.exit();
});
try {
  Deno.addSignalListener("SIGTERM", () => {
    shutdown();
    Deno.exit();
  });
} catch (_err) {
  // not supported on windows
}

const args = cli.parseArgs(Deno.args, { string: ["spawn"], boolean: ["play-mode"] });

startInstanceCollector();

await Promise.all([
  // boot instance
  (async () => {
    const world = args.spawn;
    if (!world) return;

    console.log("Spawning an instance...");

    instance = createInstance({
      instanceId: NIL_UUID,
      worldId: world,
      worldDirectory: `${Deno.cwd()}/worlds/${world}`,
      editMode: !(args["play-mode"] ?? false),
      inspect: "127.0.0.1:9229",
    });

    await instance.waitForSessionBoot();
  })(),
  // listen web
  (async () => {
    const addr = CONFIG.BIND_ADDRESS;
    console.log(`Listening: http://${addr.hostname}:${addr.port} ...`);
    await app.listen({
      hostname: addr.hostname,
      port: addr.port,
      signal: webAbortController.signal,
    });
  })(),
]);
