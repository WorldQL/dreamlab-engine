// ive become the grim reapers housewife

import { GameInstance } from "./instance.ts";

const instanceCollectorTask = () => {
  // removes old stopped instances, run periodically

  for (const instance of [...GameInstance.INSTANCES.values()]) {
    if (instance.info.editMode) continue;

    // instances bump idle time whenever a session gets a ping packet,
    // so we don't need to check player count.

    const TEN_MINUTES = 10 * 60 * 1000;
    const idleTime = Date.now() - instance.idleSince.getTime();
    if (idleTime > TEN_MINUTES) {
      instance.logs.info("instance reaper: instance idled too long! shutting down", {
        idleTime,
      });
      instance.shutdown();
      GameInstance.INSTANCES.delete(instance.info.instanceId);
    }
  }
};

const instanceWatchdogTask = () => {
  // kills instances which are not responding, run frequently

  for (const instance of GameInstance.INSTANCES.values()) {
    for (const session of [instance.session, instance.playSession]) {
      if (session === undefined) continue;
      if (session.wasShutDown) continue;

      if (Date.now() - session.lastHeartbeat > 5_000) {
        instance.logs.error("Forcefully terminating session as it was not responding");
        try {
          session.ipc.process.kill("SIGKILL");
        } catch (err) {
          // ignore
        }
        session.shutdown();
      }
    }
  }
};

export const startInstanceCollector = () => {
  setInterval(instanceCollectorTask, 30_000);
  setInterval(instanceWatchdogTask, 1_000);
};
