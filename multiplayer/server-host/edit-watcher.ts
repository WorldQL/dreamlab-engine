import * as path from "@std/path";
import { debounce } from "jsr:@std/async/debounce";
import { fileIsProbablyBehaviorScript } from "../../build-system/build-world.ts";
import { buildWorld } from "../common-host/world-build.ts";
import { GameSession } from "./session.ts";

export async function watchForEditChanges(session: GameSession, subdir: string) {
  const instance = session.parent;

  ["src", "instructions"].forEach(dir =>
    Deno.mkdirSync(`${instance.info.worldDirectory}/${dir}`, { recursive: true }),
  );

  const watcher = Deno.watchFs(
    [`${instance.info.worldDirectory}/src`, `${instance.info.worldDirectory}/instructions`],
    { recursive: true },
  );
  session.editWatcher = watcher;

  const touchedPaths = new Set<string>();

  const rebuild = debounce(async () => {
    await buildWorld(
      instance.info.worldId,
      instance.info.worldDirectory,
      subdir,
      instance.logs,
    );

    for (const touchedPath of touchedPaths) {
      const relativePath = path.relative(instance.info.worldDirectory, touchedPath);
      const isBehavior = await fileIsProbablyBehaviorScript(touchedPath);
      session.broadcastPacket({
        t: "ScriptEdited",
        script_location: relativePath,
        behavior_script_id: isBehavior
          ? `res://${relativePath.replace(/\.tsx?$/, ".js")}`
          : undefined,
        isFromFileSystem: true,
      });
    }

    touchedPaths.clear();
  }, 60);

  for await (const event of watcher) {
    if (
      event.kind === "modify" ||
      event.kind === "create" ||
      event.kind === "rename" ||
      event.kind === "remove"
    ) {
      event.paths.forEach(it => touchedPaths.add(it));
      rebuild();
    }
  }
}
