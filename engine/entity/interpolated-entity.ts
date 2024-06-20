import { IVector2, Vector2, lerpAngle } from "../math/mod.ts";
import { EntityPreUpdate, EntityUpdate, GamePreRender } from "../signals/mod.ts";
import { Entity, EntityContext } from "./entity.ts";

export abstract class InterpolatedEntity extends Entity {
  #lastRenderPos: IVector2 | undefined;
  #lastRenderRot: number | undefined;

  protected readonly interpolated = {
    position: new Vector2(this.globalTransform.position),
    rotation: this.globalTransform.rotation,
  };

  constructor(ctx: EntityContext) {
    super(ctx);

    let prevRenderPos: IVector2 | undefined;
    let prevRenderRot: number | undefined;

    this.on(EntityPreUpdate, () => {
      prevRenderPos = this.globalTransform.position.bare();
      prevRenderRot = this.globalTransform.rotation;
    });

    this.on(EntityUpdate, () => {
      this.#lastRenderPos = prevRenderPos;
      this.#lastRenderRot = prevRenderRot;
    });

    this.listen(this.game, GamePreRender, () => {
      this.interpolated.position =
        this.#lastRenderPos !== undefined
          ? Vector2.lerp(
              this.#lastRenderPos,
              this.globalTransform.position,
              this.game.time.partial,
            )
          : this.globalTransform.position;

      this.interpolated.rotation =
        this.#lastRenderRot !== undefined
          ? lerpAngle(
              this.#lastRenderRot,
              this.globalTransform.rotation,
              this.game.time.partial,
            )
          : this.globalTransform.rotation;
    });
  }
}
