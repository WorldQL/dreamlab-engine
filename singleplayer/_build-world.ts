import { ensureDir } from "jsr:@std/fs@1";
import { dirname, relative } from "jsr:@std/path@1";
import { bundleWorld } from "../build-system/mod.ts";

export async function bundleSingleplayerWorld(worldId: string) {
  // 1. copy recursively from multiplayer/worlds
  // 2.

  const sourceWorldDir = "../multiplayer/worlds/" + worldId;
  const targetWorldDir = "./web/worlds/" + worldId;
  const rel = relative(sourceWorldDir, targetWorldDir);

  await ensureDir(dirname(targetWorldDir));

  await bundleWorld(worldId, {
    denoJsonPath: "./deno.json",
    dir: sourceWorldDir,
    outDirName: rel,
  });
}

if (import.meta.main) {
  bundleSingleplayerWorld(Deno.args.at(0) ?? "dreamlab/test-world");
}
