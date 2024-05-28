import { Entity, EntityContext } from "../entity/mod.ts";
import { RenderTime } from "../entity/time.ts";
import { IVec2, Vec2 } from "../math/mod.ts";
import type { ClientGame } from "../runtime/client/client_game.ts";

// TODO: Camera
export class Camera extends Entity {
  /**
   * Scale factor from world-space units to screen-space units.
   */
  public static readonly SCALE = 100;

  /**
   * 2D scale factor from world-space units to screen-space units.
   */
  public static readonly SCALE_2D: Readonly<IVec2> = Object.freeze({
    x: Camera.SCALE,
    y: -Camera.SCALE,
  });

  public smooth = this.values.number({
    name: "smooth",
    default: 0.1, // TODO: Tweak this value until it feels good
    local: true,
    min: 0,
  });

  #position: IVec2 = {
    x: this.transform.translation.x,
    y: this.transform.translation.y,
  };

  public constructor(ctx: EntityContext) {
    super(ctx);

    if (!this.game.isClient()) {
      throw new Error("camera cannot be spawned on the server");
    }

    // TODO: Ensure only one camera exists
    // TODO: Implement scaling
  }

  public destroy(): void {
    // TODO: Camera.destroy()
  }

  public worldToScreen(position: IVec2): IVec2 {
    // TODO: Handle scaling
    const game = this.game as ClientGame;
    const { width, height } = game.app.view;

    return {
      x: -this.#position.x * Camera.SCALE_2D.x +
        position.x * Camera.SCALE_2D.x + width / 2,
      y: -this.#position.y * Camera.SCALE_2D.y +
        position.y * Camera.SCALE_2D.y + height / 2,
    };
  }

  public screenToWorld(position: IVec2): IVec2 {
    // TODO: Handle scaling
    const game = this.game as ClientGame;
    const { width, height } = game.app.view;

    const xa = -position.x + (width / 2);
    const xb = -xa + (this.#position.x * Camera.SCALE_2D.x);
    const xc = xb / Camera.SCALE_2D.x;

    const ya = -position.y + (height / 2);
    const yb = -ya + (this.#position.y * Camera.SCALE_2D.y);
    const yc = yb / Camera.SCALE_2D.y;

    return { x: xc, y: yc };
  }

  public onRender({ delta }: RenderTime): void {
    if (this.smooth.value === 0) {
      this.#position = {
        x: this.globalTransform.translation.x,
        y: this.globalTransform.translation.y,
      };
    } else {
      this.#position = Vec2.lerp(
        this.#position,
        this.globalTransform.translation,
        delta,
        this.smooth.value,
      );
    }
  }
}
