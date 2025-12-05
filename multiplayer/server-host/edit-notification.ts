import { PlayPacket } from "@dreamlab/proto/play.ts";
import * as path from "@std/path";
import { fileIsProbablyBehaviorScript } from "../../build-system/build-world.ts";
import { buildWorld } from "../common-host/world-build.ts";
import { CONFIG } from "./config.ts";
import { GameInstance } from "./instance.ts";

export async function emitScriptEditNotifications(
  instance: GameInstance,
  touchedPaths: string[],
  isFromFileSystem: boolean = false,
) {
  const packets: PlayPacket<"ScriptEdited">[] = [];

  for (const touchedPath of touchedPaths) {
    const relativePath = path.relative(instance.info.worldDirectory, touchedPath);
    let isBehavior = false;
    try {
      isBehavior = await fileIsProbablyBehaviorScript(touchedPath);
    } catch {
      // File might have been deleted, so it's not a behavior script
      isBehavior = false;
    }

    packets.push({
      t: "ScriptEdited",
      script_location: relativePath,
      behavior_script_id: isBehavior
        ? `res://${relativePath.replace(/\.tsx?$/, ".js")}`
        : undefined,
      isFromFileSystem,
    });
  }

  await buildWorld(instance.info.worldId, instance.info.worldDirectory, "_dist", instance.logs);
  for (const p of packets) instance.session?.broadcastPacket(p);

  if (instance.playSession) {
    await buildWorld(
      instance.info.worldId,
      instance.info.worldDirectory,
      "_dist_play",
      instance.logs,
    );

    if (!CONFIG.NO_HOT_RELOAD) {
      instance.playSession.ipc.send({
        op: "ReloadBehaviors",
        scripts: packets.map(it => it.behavior_script_id).filter(it => it !== undefined),
      });
    }

    for (const p of packets) instance.playSession?.broadcastPacket(p);
  }
}
