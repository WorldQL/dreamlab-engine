import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EntityDestroyed, GameRender } from "../signals/mod.ts";
import { EntityContext } from "./entity.ts";
import { InterpolatedEntity } from "./interpolated-entity.ts";

export abstract class PixiEntity extends InterpolatedEntity {
  protected container: PIXI.Container | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.listen(this.game, GameRender, () => {
      if (!this.container) return;

      const pos = this.interpolated.position;
      this.container.position = { x: pos.x, y: -pos.y };
      this.container.rotation = -this.interpolated.rotation;
    });

    this.on(EntityDestroyed, () => {
      this.container?.destroy({ children: true });
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    this.container = new PIXI.Container();
    this.game.renderer.scene.addChild(this.container);
  }
}
