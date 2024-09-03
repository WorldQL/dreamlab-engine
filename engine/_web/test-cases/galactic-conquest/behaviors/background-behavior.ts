import { Behavior, BehaviorContext } from "../../../../behavior/mod.ts";
import { Camera, Sprite, TilingSprite } from "../../../../entity/mod.ts";
import { Vector2 } from "../../../../math/mod.ts";
import { Vector2Adapter } from "../../../../value/adapters/vector-adapter.ts";

export class BackgroundBehavior extends Behavior {
  parallax: Vector2 = Vector2.ZERO;

  // TODO: AnimatedSprite2D
  #sprite: Sprite | TilingSprite;
  #origin = Vector2.ZERO;

  constructor(ctx: BehaviorContext) {
    super(ctx);

    try {
      this.#sprite = this.entity.cast(Sprite);
    } catch {
      // Ignore
    }

    try {
      this.#sprite = this.entity.cast(TilingSprite);
    } catch {
      // Ignore
    }

    // @ts-expect-error: unassigned class member
    if (!this.#sprite) {
      throw new Error("Background can only be used on Sprite type entities");
    }

    this.defineValue(BackgroundBehavior, "parallax", { type: Vector2Adapter });
  }

  onInitialize(): void {
    this.#origin.assign(this.entity.pos);
  }

  onFrame(): void {
    const camera = Camera.getActive(this.game);
    if (!camera) return;

    const cam = new Vector2(camera.smoothed.position);
    const sprite = this.#sprite;
    const tileScale = sprite instanceof TilingSprite ? sprite.tileScale : { x: 1, y: 1 };

    const distance = cam.mul(this.parallax);
    const inverse = cam.mul(Vector2.ONE.sub(this.parallax));

    // TODO: Snap position without interpolating
    sprite.pos = this.#origin.add(distance);

    const width = sprite.width * tileScale.x;
    const height = sprite.height * tileScale.y;

    if (inverse.x > this.#origin.x + width) this.#origin.x += width;
    else if (inverse.x < this.#origin.x - width) this.#origin.x -= width;

    if (inverse.y > this.#origin.y + height) this.#origin.y += height;
    else if (inverse.y < this.#origin.y - height) this.#origin.y -= height;
  }
}
