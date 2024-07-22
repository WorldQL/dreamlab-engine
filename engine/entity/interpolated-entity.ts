import { IVector2, Vector2, lerpAngle } from "../math/mod.ts";
import { EntityPreUpdate, EntityUpdate, GamePreRender } from "../signals/mod.ts";
import { Entity, EntityContext } from "./entity.ts";

export abstract class InterpolatedEntity extends Entity {
  #prevPos: IVector2 = this.pos.bare();
  #currentPos: IVector2 = this.pos.bare();

  protected readonly interpolated = {
    position: new Vector2(this.globalTransform.position),
    rotation: this.globalTransform.rotation,
  };

  constructor(ctx: EntityContext) {
    super(ctx);

    // let prevRenderPos: IVector2 | undefined;
    // let prevRenderRot: number | undefined;

    // this.on(EntityPreUpdate, () => {
    //   prevRenderPos = this.globalTransform.position.bare();
    //   prevRenderRot = this.globalTransform.rotation;
    // });

    this.on(EntityUpdate, () => {
      this.#prevPos = this.#currentPos;
      this.#currentPos = this.pos.bare();
      // this.#lastRenderPos = prevRenderPos;
      // this.#lastRenderRot = prevRenderRot;
    });

    this.listen(this.game, GamePreRender, () => {
      // this.interpolated.position = this.globalTransform.position;
      // console.log({ prev: this.#prevPos.x, current: this.#currentPos.x });
      // this.interpolated.position = this.pos;
      // console.log(this.time.partial);
      this.interpolated.position = Vector2.lerp(
        this.#prevPos,
        this.#currentPos,
        this.game.time.partial,
      );
      // this.interpolated.position =
      //   this.#lastRenderPos !== undefined
      //     ? Vector2.lerp(
      //         this.#lastRenderPos,
      //         this.globalTransform.position,
      //         this.game.time.partial,
      //       )
      //     : this.globalTransform.position;
      // this.interpolated.rotation =
      //   this.#lastRenderRot !== undefined
      //     ? lerpAngle(
      //         this.#lastRenderRot,
      //         this.globalTransform.rotation,
      //         this.game.time.partial,
      //       )
      //     : this.globalTransform.rotation;
    });
  }
}
