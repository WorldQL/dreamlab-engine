import { Transform, Vector2, transformWorldToLocal } from "../../math/mod.ts";
import { exclusiveSignalType } from "../../signal.ts";
import { EntityDestroyed, GameRender } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { Camera } from "./camera.ts";

export class Clicked {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly worldPosition: Vector2,
    public readonly screenPosition: Vector2,
  ) {}

  [exclusiveSignalType] = Clickable;
}

export class Clickable extends Entity {
  public static readonly icon = "👆";

  width: number = 1;
  height: number = 1;

  private static installed = false;
  private static hover = new Set<string>();
  private static onRender(this: void): void {
    const canvas = game.renderer.app.canvas;
    if (Clickable.hover.size > 0) canvas.style.cursor = "pointer";
    else canvas.style.cursor = "";
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    if (!Clickable.installed) {
      Clickable.installed = true;
      this.game.on(GameRender, Clickable.onRender);
    }

    this.defineValues(Clickable, "width", "height");

    this.listen(this.game, GameRender, () => {
      if (!this.game.isClient()) return;

      const camera = Camera.getActive(this.game);
      if (!camera) return;

      const cursor = this.inputs.cursor;
      if (!cursor) return;

      const isInBounds = this.#isInBounds(cursor.world);
      if (isInBounds) Clickable.hover.add(this.id);
      else Clickable.hover.delete(this.id);
    });

    this.on(EntityDestroyed, () => {
      Clickable.hover.delete(this.id);
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
    // TODO: Transform to parent local space
    // const transform = new Transform({ position: cursor.world });
    // transformWorldToLocal(this.transform, transform)

    return (
      worldPosition.x >= -0.5 &&
      worldPosition.x <= 0.5 &&
      worldPosition.y >= -0.5 &&
      worldPosition.y <= 0.5
    );
  }
}
Entity.registerType(Clickable, "@core");
