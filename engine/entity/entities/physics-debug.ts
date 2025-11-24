import {
  Camera,
  Entity,
  EntityContext,
  EntityDestroyed,
  GamePostRender,
} from "@dreamlab/engine";
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

    const camera = Camera.getActive(this.game);
    if (!camera) return;

    const { vertices, colors } = this.game.physics.world.debugRender();
    const vtx = vertices;

    if (vtx.length === 0 || colors.length === 0) return;

    const safe = 1.2;
    const cameraFrustum = camera.frustum;
    const safeFrustum = {
      width: cameraFrustum.width * safe,
      height: cameraFrustum.height * safe,
    };

    const tl = camera.pos.sub({ x: safeFrustum.width / 2, y: safeFrustum.height / 2 });
    const rect = new PIXI.Rectangle(tl.x, tl.y, safeFrustum.width, safeFrustum.height);

    for (let i = 0; i < vtx.length / 4; i += 1) {
      const x1 = vtx[i * 4 + 0];
      const y1 = vtx[i * 4 + 1];
      const x2 = vtx[i * 4 + 2];
      const y2 = vtx[i * 4 + 3];

      if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
        console.warn("invalid vertex buffer");
        continue;
      }

      // cull lines that arent inside camera frustum
      const in1 = rect.contains(x1, y1);
      const in2 = rect.contains(x2, y2);
      if (!in1 && !in2) continue;

      const r = colors[i * 4 + 0];
      const g = colors[i * 4 + 1];
      const b = colors[i * 4 + 2];
      const a = colors[i * 4 + 3];

      if (r === undefined || g === undefined || b === undefined || a === undefined) {
        console.warn("invalid colour buffer");
        continue;
      }

      this.#gfx
        .moveTo(x1, -y1)
        .lineTo(x2, -y2)
        .stroke({ color: [r, g, b, a], alpha: 1, pixelLine: true });
    }
  }
}
