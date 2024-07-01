import { Vector2, pointWorldToLocal } from "../../math/mod.ts";
import { EntityDestroyed } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

export class Click {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly worldPosition: Vector2,
    public readonly screenPosition: Vector2,
  ) {}
}

export class MouseDown {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly worldPosition: Vector2,
    public readonly screenPosition: Vector2,
  ) {}
}

export class MouseUp {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly worldPosition: Vector2,
    public readonly screenPosition: Vector2,
  ) {}
}

abstract class ClickableEntity extends Entity {
  constructor(ctx: EntityContext) {
    super(ctx);

    // TODO: Change cursor on hover

    this.on(EntityDestroyed, () => {
      if (!this.game.isClient()) return;

      const canvas = this.game.renderer.app.canvas;
      canvas.removeEventListener("mousedown", this.#onMouseDown);
      canvas.removeEventListener("mouseup", this.#onMouseUp);
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("mousedown", this.#onMouseDown);
    canvas.addEventListener("mouseup", this.#onMouseUp);
  }

  #onMouseUp = (ev: MouseEvent) => this.#onMouse(ev, false);
  #onMouseDown = (ev: MouseEvent) => this.#onMouse(ev, true);

  #onMouse = (ev: MouseEvent, pressed: boolean) => {
    if (!pressed) return;
    const button =
      ev.button === 0
        ? "left"
        : ev.button === 1
        ? "middle"
        : ev.button === 2
        ? "right"
        : undefined;

    if (!button) return;

    const cursor = this.inputs.cursor;
    if (!cursor) return;
    if (!this.isInBounds(cursor.world)) return;

    if (pressed) {
      this.fire(MouseDown, button, cursor.world, cursor.screen);
      this.fire(Click, button, cursor.world, cursor.screen);
    } else {
      this.fire(MouseUp, button, cursor.world, cursor.screen);
    }
  };

  protected abstract isInBounds(worldPosition: Vector2): boolean;
}

export class ClickableRect extends ClickableEntity {
  public static readonly icon = "👆";

  width: number = 1;
  height: number = 1;

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(ClickableRect, "width", "height");
  }

  protected isInBounds(worldPosition: Vector2): boolean {
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);

    return (
      localPosition.x >= this.width / -2 &&
      localPosition.x <= this.width / 2 &&
      localPosition.y >= this.height / -2 &&
      localPosition.y <= this.height / 2
    );
  }
}
Entity.registerType(ClickableRect, "@core");

export class ClickableCircle extends ClickableEntity {
  public static readonly icon = "👆";

  radius: number = 1;
  innerRadus: number = 0;

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(ClickableCircle, "radius", "innerRadus");
  }

  protected isInBounds(worldPosition: Vector2): boolean {
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);

    const radiusSq = this.radius * this.radius;
    const innerSq = this.innerRadus * this.innerRadus;
    const distanceSq = localPosition.magnitudeSquared();

    return distanceSq >= innerSq && distanceSq <= radiusSq;
  }
}
Entity.registerType(ClickableCircle, "@core");
