import { parseArgs } from "@std/cli";

import * as log from "./util/log.ts";
log.setup();

import { APP_CONFIG } from "./config.ts";
import { listenWeb } from "./web/mod.ts";

import { createInstance, type RunningInstance } from "./instance/mod.ts";
import { reapInstances } from "./instance-reaper.ts";

const main = async () => {
  const instances = new Map<string, RunningInstance>();
  reapInstances(instances);

  const addr = APP_CONFIG.bindAddress;
  log.info(`Listening: http://${addr.hostname}:${addr.port} ...`);

  const controller = new AbortController();
  const listenPromise = listenWeb(instances, controller.signal);

  const cliArgs = [...Deno.args];
  const [subcommand] = cliArgs.splice(0, 1);

  if (subcommand === "spawn") {
    const args = parseArgs(cliArgs, {
      boolean: ["no-edit", "debug"],
      string: ["instance-id", "variant"],
      alias: { "instance-id": "i" },
    });
    const worldId = String(args._[0] ?? "dreamlab/survival");
    const instanceId = args["instance-id"] ?? "00000000-0000-0000-0000-000000000000";

    const instance = createInstance(instanceId, worldId, args["variant"] ?? "main", {
      editMode: !args["no-edit"],
      debugMode: args["debug"],
    });
    instances.set(instanceId, instance);
  }

  const shutdown = () => {
    log.info("Shutting down...");
    for (const instance of instances.values()) {
      instance.shutdown();
    }
    controller.abort();
  };

  Deno.addSignalListener("SIGINT", () => {
    shutdown();
    Deno.exit();
  });

  Deno.addSignalListener("SIGTERM", () => {
    shutdown();
    Deno.exit();
  });

  await listenPromise;
};

try {
  await main();
} catch (err) {
  console.error("%c%o", "color: red", err);
}
