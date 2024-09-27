import { Behavior } from "@dreamlab/engine";

export default class SpriteSpawner extends Behavior {
  onInitialize(): void {
    if (!this.game.isServer()) return;
    this.game.prefabs._.TheSprite.cloneInto(this.game.world, { name: "SpriteInstance" });
  }
}
