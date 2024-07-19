import { Vector2, pointWorldToLocal } from "../../math/mod.ts";
import {
  Click,
  EntityDestroyed,
  GameRender,
  MouseDown,
  MouseOut,
  MouseOver,
  MouseUp,
} from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { Camera } from "./camera.ts";

const dataSymbol = Symbol.for("dreamlab.clickableentity.internal");
export abstract class ClickableEntity extends Entity {
  #clicked: boolean = false;
  get clicked(): boolean {
    return this.#clicked;
  }

  #hover: boolean = false;
  get hover(): boolean {
    return this.#hover;
  }

  #hoverSet: Set<string> | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    if (this.game.isClient()) {
      // the normal container in play, the editor UI in edit mode
      const canvas =
        document.getElementById("dreamlab-pointer-style-target") ??
        this.game.renderer.app.canvas;
      // TODO: Better API for this
      // @ts-expect-error: internal data
      if (!this.game[dataSymbol]) {
        const set = new Set<string>();
        // @ts-expect-error: internal data
        this.game[dataSymbol] = set;

        this.game.on(GameRender, () => {
          if (set.size > 0) canvas.style.cursor = "pointer";
          else canvas.style.cursor = "";
        });
      }

      // @ts-expect-error: internal data
      this.#hoverSet = this.game[dataSymbol];
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#hoverSet) return;

      const camera = Camera.getActive(this.game);
      if (!camera) return;

      const cursor = this.inputs.cursor;
      if (!cursor) return;

      const wasInBounds = this.#hoverSet.has(this.ref);
      const isInBounds = this.isInBounds(cursor.world);
      if (isInBounds) this.#hoverSet.add(this.ref);
      else this.#hoverSet.delete(this.ref);

      if (!wasInBounds && isInBounds) {
        this.fire(MouseOver, cursor.world, cursor.screen);
        this.#hover = true;
      } else if (wasInBounds && !isInBounds) {
        this.fire(MouseOut, cursor.world, cursor.screen);
        this.#hover = false;
      }
    });

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

      if (button === "left") this.#clicked = true;
    } else {
      this.fire(MouseUp, button, cursor.world, cursor.screen);

      if (button === "left") this.#clicked = false;
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
