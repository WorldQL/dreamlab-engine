import { RunningInstance } from "./instance/mod.ts";

/// Spawns the instance reaper. The instance reaper cleans up any old & inactive instances
export const reapInstances = (instances: Map<string, RunningInstance>) => {
  setInterval(() => {
    for (const [instanceId, instance] of instances.entries()) {
      let shouldKill = false;

      // kill non-running instances that have idled for longer than 30 mins
      if (
        instance.status !== "Started" &&
        instance.idleSince.getTime() < Date.now() - 1000 * 30 * 60
      ) {
        shouldKill = true;
      }

      // kill empty instances that have idled for longer than 60 mins
      if (
        instance.idleSince.getTime() < Date.now() - 1000 * 60 * 60 &&
        !instance.game?.richStatus?.player_count
      ) {
        shouldKill = true;
      }

      // don't kill instances that are running edit sessions
      if (instance.editMode) {
        shouldKill = false;
      }

      if (shouldKill) {
        instance.logs.debug("Killed by instance reaper");
        instance.shutdown();
        instances.delete(instanceId);
      }
    }
  }, 30_000);
};
