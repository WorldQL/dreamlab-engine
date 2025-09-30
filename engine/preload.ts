import type { ClientGame } from "@dreamlab/engine";
import { preloadInfo } from "@dreamlab/engine/internal";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export type PreloadInfo = {
  readonly textures?: string[];
  readonly images?: string[];
  readonly spritesheets?: string[];
  readonly audioClips?: string[];
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

  if (info.images) {
    const images = info.images.map(url => game.resolveResource(url));
    const job = images.map(async url => {
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
      } catch {
        // ignore
      }
    });

    jobs.push(Promise.all(job));
  }

  if (info.spritesheets) {
    const spritesheets = info.spritesheets.map(url => game.resolveResource(url));
    jobs.push(PIXI.Assets.load(spritesheets));
  }

  if (info.audioClips) {
    const _audioClips = info.audioClips.map(url => game.resolveResource(url));
    console.warn("preloading audio clips is not implemented yet");
    // TODO: implement preloading audio clips
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
