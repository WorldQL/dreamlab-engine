import { Entity, EntityContext, EntityDestroyed, GamePostRender } from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export class PhysicsDebug extends Entity {
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

    const { vertices, colors } = this.game.physics.world.debugRender();
    const vtx = vertices;

    for (let i = 0; i < vtx.length / 4; i += 1) {
      const x1 = vtx[i * 4 + 0];
      const y1 = vtx[i * 4 + 1];
      const x2 = vtx[i * 4 + 2];
      const y2 = vtx[i * 4 + 3];

      if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
        console.warn("invalid vertex buffer");
        continue;
      }

      const r = colors[i * 4 + 0];
      const g = colors[i * 4 + 1];
      const b = colors[i * 4 + 2];
      const a = colors[i * 4 + 3];

      if (r === undefined || g === undefined || b === undefined || a === undefined) {
        console.warn("invalid colour buffer");
        continue;
      }

      const color = new PIXI.Color({
        r: r * 255,
        g: g * 255,
        b: b * 255,
        a: a * 255,
      });

      const start = { x: x1, y: -y1 };
      const end = { x: x2, y: -y2 };

      this.#gfx
        .moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ color, alpha: 1, pixelLine: true });
    }
  }
}
