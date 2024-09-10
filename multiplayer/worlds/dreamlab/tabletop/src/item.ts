import { BehaviorContext, Entity, Vector2 } from "@dreamlab/engine";
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
import Hand from "./hand.ts";

export default class Item extends Behavior {
  #clickable: ClickableEntity;
  #origin: Vector2 | undefined;
  #oldParent: Entity | undefined;

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

      if (this.#oldParent) {
        this.entity.parent = this.#oldParent;
        this.#oldParent = undefined;
      }

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

      const zones = this.game.entities
        .lookupByBehavior(Dropzone)
        .filter(e => e.root !== this.game.prefabs)
        .map(e => e.getBehavior(Dropzone));

      const hands = this.game.entities
        .lookupByBehavior(Hand)
        .filter(e => e.root !== this.game.prefabs)
        .map(e => e.getBehavior(Hand));

      const targets = [...zones, ...hands]
        .filter(b => {
          const e = b.entity;
          const aabb: Box = {
            x: e.pos.x - b.width / 2,
            y: e.pos.y - b.height / 2,
            width: b.width,
            height: b.height,
          };

          return areAABBvsOBBIntersecting(aabb, obb);
        })
        .toSorted(
          (a, b) =>
            a.entity.pos.distanceSquared(this.entity.pos) -
            b.entity.pos.distanceSquared(this.entity.pos),
        );

      const [target] = targets;
      if (!target) return;

      if (target instanceof Dropzone) {
        this.entity.setGlobalTransform({ position: target.entity.pos });
      } else {
        this.#oldParent = this.entity.parent;
        this.entity.parent = target.entity;
      }
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
