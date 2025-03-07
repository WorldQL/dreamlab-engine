// ive become the grim reapers housewife

import { CONFIG } from "./config.ts";
import { GameInstance } from "./instance.ts";

const instanceCollectorTask = () => {
  for (const instance of [...GameInstance.INSTANCES.values()]) {
    const threshold = instance.info.editMode ? 10 * 60 * 1000 : 10 * 60 * 1000; // 10 minutes for non-edit mode

    const idleTime = Date.now() - instance.idleSince.getTime();
    if (idleTime > threshold) {
      instance.logs.info("instance reaper: instance idled too long! shutting down", {
        idleTime,
      });
      deleteRoomsForInstance(instance.info.instanceId);
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

/**
 * Deletes all Yjs rooms associated with the given instanceId.
 */
export async function deleteRoomsForInstance(instanceId: string): Promise<void> {
  if (CONFIG.CODE_EDITOR_YJS_URL) {
    try {
      const res = await fetch(
        `${CONFIG.CODE_EDITOR_YJS_URL}/rooms/instance/${encodeURIComponent(instanceId)}`,
        { method: "DELETE" },
      );

      if (!res.ok) throw new Error(res.statusText);
    } catch (err) {
      console.error(`Failed to delete Yjs rooms for instance ${instanceId}:`, err);
    }
  }
}
