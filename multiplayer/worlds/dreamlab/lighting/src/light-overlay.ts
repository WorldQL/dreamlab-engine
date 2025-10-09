import { Behavior, BehaviorDestroyed, Collider, RawPixi, value } from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Ray } from "@dreamlab/vendor/rapier.ts";

export default class LightOverlay extends Behavior {
  @value()
  rays: number = 7200;

  @value()
  maxDistance: number = 100;

  #pixi = this.entity.cast(RawPixi);
  #overlay!: PIXI.Graphics;
  #mask!: PIXI.Graphics;

  #overlayCtx = new PIXI.GraphicsContext()
    .rect(-100, -100, 200, 200)
    .fill({ color: "black", alpha: 0.8 });

  onInitialize(): void {
    if (!this.game.isClient()) return;
    if (!this.#pixi.container) return;

    this.#mask = new PIXI.Graphics();
    this.#overlay = new PIXI.Graphics(this.#overlayCtx);
    this.#overlay.setMask({
      mask: this.#mask,
      inverse: true,
    });

    this.#pixi.container.addChild(this.#mask);
    this.#pixi.container.addChild(this.#overlay);

    this.on(BehaviorDestroyed, () => {
      this.#overlay?.destroy();
      this.#overlayCtx?.destroy();
      this.#mask?.destroy();
    });
  }

  onFrame(): void {
    if (!this.game.isClient()) return;
    this.#mask.clear();

    const { world } = this.game.inputs.cursor;
    if (!world) return;

    const colliders = this.game.entities
      .lookupByPosition(world)
      .filter(entity => entity instanceof Collider);

    if (colliders.length > 0) return;

    const rays = this.rays;
    const toi = this.maxDistance;
    const solid = true;

    // TODO: include rays that directly intersect collider corners

    this.#mask.moveTo(world.x, -world.y);
    for (let i = 0; i < rays + 1; i++) {
      const angle = (i / rays) * Math.PI * 2;
      const ray = new Ray(world, { x: Math.sin(angle), y: Math.cos(angle) });
      const hit = this.game.physics.world.castRay(ray, toi, solid);

      const impact = hit?.timeOfImpact ?? toi;
      const point = ray.pointAt(impact - 0.01);

      this.#mask.lineTo(point.x, -point.y);
    }

    this.#mask.lineTo(world.x, -world.y).fill("white");
  }
}
