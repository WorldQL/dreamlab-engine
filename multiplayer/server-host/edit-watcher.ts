import * as path from "@std/path";
import { debounce } from "jsr:@std/async/debounce";
import { GameSession } from "./session.ts";
import { buildWorld } from "./world-build.ts";

export async function watchForEditChanges(session: GameSession, subdir: string) {
  const instance = session.parent;

  const watcher = Deno.watchFs([`${instance.info.worldDirectory}/src`], { recursive: true });
  session.editWatcher = watcher;

  const touchedPaths = new Set<string>();

  const rebuild = debounce(async () => {
    await buildWorld(instance.info.worldId, instance.info.worldDirectory, subdir);

    for (const touchedPath of touchedPaths) {
      const relativePath = path.relative(instance.info.worldDirectory, touchedPath);
      session.broadcastPacket({
        t: "ScriptEdited",
        script_location: relativePath,
        behavior_script_id: relativePath.startsWith("src/")
          ? `res://${relativePath.replace(/\.tsx?$/, ".js")}`
          : undefined,
      });
    }
  }, 60);

  for await (const event of watcher) {
    if (event.kind === "modify" || event.kind === "create") {
      event.paths.forEach(it => touchedPaths.add(it));
      rebuild();
    }
  }
}
