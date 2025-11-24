import {
  Entity,
  EntityContext,
  EntityDestroyed,
  GamePostRender,
  Vector2,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class BoundsDebug extends Entity {
  static {
    Entity.registerType(this, "@editor");
  }

  static readonly icon: string = "🪛";
  readonly bounds: undefined;

  #gfx: PIXI.Graphics | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.listen(this.game, GamePostRender, () => {
      this.#render();
    });

    this.on(EntityDestroyed, () => {
      this.#gfx?.destroy({ children: true });
    });
  }

  onInitialize(): void {
    if (!this.game.isClient()) return;

    this.#gfx = new PIXI.Graphics({ zIndex: Number.MAX_SAFE_INTEGER });
    this.game.renderer.scene.addChild(this.#gfx);
  }

  #render(): void {
    if (!this.#gfx) return;
    this.#gfx.clear();

    for (const child of this.children.values()) {
      const bounds = child.bounds;
      if (!bounds) continue;

      const offset = bounds.offset ?? Vector2.ZERO;
      const center = child.pos.add(offset);
      const tl = center.sub({ x: bounds.width / 2, y: bounds.height / -2 });

      this.#gfx
        .rect(tl.x, -tl.y, bounds.width, bounds.height)
        .stroke({ color: "red", pixelLine: true });
    }
  }
}
