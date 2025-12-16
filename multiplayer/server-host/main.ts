import { Application } from "@oak/oak";
import * as cli from "@std/cli";
import * as path from "@std/path";
import { NIL_UUID } from "@std/uuid/constants";
import { CONFIG } from "./config.ts";
import { startInstanceCollector } from "./instance-collector.ts";
import { createInstance, GameInstance, GameInstanceState } from "./instance.ts";
import { report } from "./metrics.ts";
import { setupWeb } from "./web/setup.ts";
import { fetchWorld } from "./world-fetch.ts";

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
      .filter(it => !it.wasShutDown)
      .map(
        async session =>
          ({ session, worker: session.ipc, metrics: await session.metrics() }) as const,
      ),
  );

  const data = await Promise.all(jobs);

  const MEMORY_THRESHOLD = 1000; // TODO: real value
  for (const { session, metrics } of data) {
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

const args = cli.parseArgs(Deno.args, {
  string: ["spawn", "spawn-dir", "spawn-repo", "clone"],
  boolean: ["play-mode", "spawn-fail"],
});

if (args.clone !== undefined) {
  const world = args.clone;

  instance = createInstance({
    instanceId: NIL_UUID,
    worldId: world,
    worldDirectory: `${CONFIG.WORLDS_DIRECTORY}/${world}`,
    editMode: false,
  });

  await fetchWorld(instance);

  Deno.exit(0);
}

startInstanceCollector();

await Promise.all([
  // boot instance
  (async () => {
    if (args.spawn) {
      const world = args.spawn;
      console.log("Spawning an instance...");

      instance = createInstance({
        instanceId: NIL_UUID,
        worldId: world,
        worldDirectory: `${CONFIG.WORLDS_DIRECTORY}/${world}`,
        editMode: !(args["play-mode"] ?? false),
        gitId: args["spawn-repo"],
        inspect: "127.0.0.1:9229",
      });

      instance.onStatusChange(state => {
        if (!args["spawn-fail"]) return;
        if (state !== GameInstanceState.Errored) return;

        shutdown();
        Deno.exit(1);
      });

      await instance.waitForSessionBoot();
    } else if (args["spawn-dir"]) {
      const worldDirectory = args["spawn-dir"];
      const world = "external/" + path.basename(worldDirectory);

      instance = createInstance({
        instanceId: NIL_UUID,
        worldId: world,
        worldDirectory,
        editMode: true,
        inspect: "127.0.0.1:9229",
      });

      instance.onStatusChange(state => {
        if (!args["spawn-fail"]) return;
        if (state !== GameInstanceState.Errored) return;

        shutdown();
        Deno.exit(1);
      });

      await instance.waitForSessionBoot();
    }
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
