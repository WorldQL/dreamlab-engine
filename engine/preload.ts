import type { ClientGame } from "@dreamlab/engine";
import { preloadInfo } from "@dreamlab/engine/internal";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export type PreloadInfo = {
  readonly textures?: string[];
  // TODO: more things

  readonly custom?: () => void | Promise<void>;
};

export function definePreload(
  info: PreloadInfo | (() => PreloadInfo),
): PreloadInfo & { [preloadInfo]: true } {
  const _info = typeof info === "function" ? info() : info;
  return Object.assign(_info, { [preloadInfo]: true as const });
}

export async function preload(game: ClientGame, info: PreloadInfo): Promise<void> {
  const jobs: Promise<unknown>[] = [];

  if (info.textures) {
    const textures = info.textures.map(url => game.resolveResource(url));
    jobs.push(PIXI.Assets.load(textures));
  }

  if (info.custom) {
    const fn = info.custom;
    jobs.push(
      (async () => {
        try {
          await fn();
        } catch (error) {
          console.warn("error occurred in custom preload fn", error);
        }
      })(),
    );
  }

  if (jobs.length === 0) return Promise.resolve();
  await Promise.all(jobs);
}
