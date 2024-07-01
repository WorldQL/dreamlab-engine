import { Vector2, pointWorldToLocal } from "../../math/mod.ts";
import { exclusiveSignalType } from "../../signal.ts";
import { EntityDestroyed } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

export class Clicked {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly worldPosition: Vector2,
    public readonly screenPosition: Vector2,
  ) {}

  [exclusiveSignalType] = ClickRect;
}

export class ClickRect extends Entity {
  public static readonly icon = "👆";

  width: number = 1;
  height: number = 1;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(ClickRect, "width", "height");

    // TODO: Change cursor on hover
    // this.listen(this.game, GameRender, () => {
    //   if (!this.game.isClient()) return;

    //   const camera = Camera.getActive(this.game);
    //   if (!camera) return;

    //   const cursor = this.inputs.cursor;
    //   if (!cursor) return;

    //   const isInBounds = this.#isInBounds(cursor.world);
    // });

    this.on(EntityDestroyed, () => {
      if (this.game.isClient()) {
        const canvas = this.game.renderer.app.canvas;
        canvas.removeEventListener("mousedown", this.#onMouseDown);
        canvas.removeEventListener("mouseup", this.#onMouseUp);
      }
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;
    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("mousedown", this.#onMouseDown);
    canvas.addEventListener("mouseup", this.#onMouseUp);
  }

  #onMouseUp = (ev: MouseEvent) => this.#onMouse(ev, true);
  #onMouseDown = (ev: MouseEvent) => this.#onMouse(ev, false);

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
    if (!this.#isInBounds(cursor.world)) return;

    this.fire(Clicked, button, cursor.world, cursor.screen);
  };

  #isInBounds(worldPosition: Vector2): boolean {
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);

    return (
      localPosition.x >= this.width / -2 &&
      localPosition.x <= this.width / 2 &&
      localPosition.y >= this.height / -2 &&
      localPosition.y <= this.height / 2
    );
  }
}
Entity.registerType(ClickRect, "@core");
