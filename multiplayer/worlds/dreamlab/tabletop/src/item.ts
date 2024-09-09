import { BehaviorContext, Vector2 } from "@dreamlab/engine";
import {
  Behavior,
  ClickableEntity,
  GameRender,
  MouseDown,
  MouseUp,
  Scroll,
} from "@dreamlab/engine";
import Dropzone from "./dropzone.ts";
import { areAABBvsOBBIntersecting, Box, RotatedBox } from "../lib/intersection.ts";

export default class Item extends Behavior {
  #clickable: ClickableEntity;
  #origin: Vector2 | undefined;

  canDrag: boolean = true;
  canFlip: boolean = false;
  canRotate: boolean = false;
  canSnap: boolean = false;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.#clickable = this.entity.cast(ClickableEntity);
  }

  onInitialize(): void {
    this.defineValues(Item, "canDrag", "canFlip", "canRotate", "canSnap");

    this.listen(this.#clickable, MouseDown, ({ button, cursor: { world } }) => {
      if (!this.canDrag) return;
      if (button !== "left") return;

      this.#origin = world.sub(this.entity.pos);
    });

    this.listen(this.#clickable, MouseUp, ({ button }) => {
      if (button !== "left") return;

      this.#origin = undefined;
      if (!this.canSnap) return;

      const obb: RotatedBox = {
        x: this.entity.pos.x,
        y: this.entity.pos.y,
        angle: this.entity.globalTransform.rotation,
        width: this.entity.globalTransform.scale.x,
        height: this.entity.globalTransform.scale.y,
      };

      // TODO: Snap
      const zones = this.game.entities
        .lookupByBehavior(Dropzone)
        .filter(e => e.root !== this.game.prefabs)
        .filter(e => {
          const zone = e.getBehavior(Dropzone);
          const aabb: Box = {
            x: e.pos.x - zone.width / 2,
            y: e.pos.y - zone.width / 2,
            width: zone.width,
            height: zone.height,
          };

          return areAABBvsOBBIntersecting(aabb, obb);
        })
        .toSorted(
          (a, b) =>
            a.pos.distanceSquared(this.entity.pos) - b.pos.distanceSquared(this.entity.pos),
        );

      const [zone] = zones;
      if (!zone) return;

      this.entity.setGlobalTransform({ position: zone.pos });
    });

    this.listen(this.inputs, Scroll, ({ delta: { y: delta } }) => {
      if (!this.canRotate) return;
      if (!this.#clickable.clicked) return;
      this.entity.globalTransform.rotation += (delta * Math.PI) / 12;
    });

    this.listen(this.game, GameRender, () => {
      if (!this.#origin) return;

      const world = this.inputs.cursor?.world;
      if (!world) return;

      this.entity.pos.assign(world.sub(this.#origin));
    });
  }
}
