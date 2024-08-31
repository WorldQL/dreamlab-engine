import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EntityDestroyed, GameRender } from "../signals/mod.ts";
import { Entity, EntityContext } from "./entity.ts";

export abstract class PixiEntity extends Entity {
  public container: PIXI.Container | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.listen(this.game, GameRender, () => {
      if (!this.container) return;

      this.container.visible = this.root !== this.game.prefabs;
      if (!this.container.visible) return;

      const pos = this.interpolated.position;
      const rot = this.interpolated.rotation;
      this.container.position = { x: pos.x, y: -pos.y };
      this.container.rotation = -rot;
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
