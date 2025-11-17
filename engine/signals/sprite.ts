import type { AnimatedSprite, Sprite, TilingSprite } from "@dreamlab/engine";

export class SpriteTextureChanged {
  constructor(public readonly sprite: Sprite | AnimatedSprite | TilingSprite) {}
}
