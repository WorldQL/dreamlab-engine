import { copy, ensureDir } from "jsr:@std/fs@1";
import { dirname } from "jsr:@std/path@1";
import { bundleWorld } from "../build-system/mod.ts";

export async function bundleSingleplayerWorld(worldId: string) {
  // 1. copy recursively from multiplayer/worlds
  // 2.

  const sourceWorldDir = "../multiplayer/worlds/" + worldId;
  const worldDir = "./web/worlds/" + worldId;

  await ensureDir(dirname(worldDir));
  await copy(sourceWorldDir, worldDir, { overwrite: true });

  await bundleWorld(worldId, {
    denoJsonPath: "./deno.json",
    dir: worldDir,
    outDirName: "_dist_singleplayer",
  });
}

if (import.meta.main) {
  bundleSingleplayerWorld(Deno.args.at(0) ?? "dreamlab/test-world");
}
