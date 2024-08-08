import { Cursor } from "../../input/inputs.ts";
import { IVector2, Vector2, pointWorldToLocal } from "../../math/mod.ts";
import { BaseGame } from "../../mod.ts";
import {
  Click,
  GameRender,
  MouseDown,
  MouseOut,
  MouseOver,
  MouseUp,
} from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

const clickedSetter = Symbol.for("dreamlab.internal.clickable.clicked-setter");
const hoverSetter = Symbol.for("dreamlab.internal.clickable.hover-setter");

export abstract class ClickableEntity extends Entity {
  #clicked: boolean = false;
  get clicked(): boolean {
    return this.#clicked;
  }
  [clickedSetter](value: boolean, button: "left" | "right" | "middle", cursor: Cursor) {
    const prev = this.#clicked;
    this.#clicked = value;

    if (!prev && value) {
      const x = { screen: cursor.screen!, world: cursor.world! };
      this.fire(MouseDown, button, x);
      if (button === "left") this.fire(Click, x);
    } else if (prev && !value) {
      this.fire(MouseUp, button, cursor);
    }
  }

  #hover: boolean = false;
  get hover(): boolean {
    return this.#hover;
  }
  [hoverSetter](value: boolean, cursor: Cursor) {
    const prev = this.#hover;
    this.#hover = value;

    if (!prev && value) {
      this.fire(MouseOver, { screen: cursor.screen!, world: cursor.world! });
    } else if (prev && !value) {
      this.fire(MouseOut, cursor);
    }
  }

  static #GameRenderListeners = new Map<BaseGame, (ev: GameRender) => void>();
  static #MouseDownListeners = new Map<BaseGame, (ev: MouseDown) => void>();
  static #MouseUpListeners = new Map<BaseGame, (ev: MouseUp) => void>();

  constructor(ctx: EntityContext) {
    super(ctx);

    if (this.game.isClient()) {
      if (!ClickableEntity.#GameRenderListeners.has(this.game)) {
        const canvas =
          document.getElementById("dreamlab-pointer-style-target") ??
          this.game.renderer.app.canvas;

        // TODO: Make z sorting optional
        const fn = (_: GameRender) => {
          const cursor = this.inputs.cursor;
          const entities = this.game.entities
            .lookupByType(ClickableEntity)
            .toSorted((a, b) => b.z - a.z);

          let hoverCount = 0;
          for (const entity of entities) {
            const isInBounds =
              hoverCount > 0
                ? false
                : (cursor.world && entity.isInBounds(cursor.world)) ?? false;

            entity[hoverSetter](isInBounds, cursor);
            if (isInBounds) hoverCount++;
          }

          if (hoverCount > 0) canvas.style.cursor = "pointer";
          else canvas.style.cursor = "";
        };

        ClickableEntity.#GameRenderListeners.set(this.game, fn);
        this.game.on(GameRender, fn);
      }

      if (!ClickableEntity.#MouseDownListeners.has(this.game)) {
        const fn = ({ button, cursor }: MouseDown) => {
          const entities = this.game.entities
            .lookupByType(ClickableEntity)
            .toSorted((a, b) => b.z - a.z);

          let clickedCount = 0;
          for (const entity of entities) {
            const isInBounds = clickedCount > 0 ? false : entity.isInBounds(cursor.world);
            if (isInBounds) {
              entity[clickedSetter](true, button, cursor);
              clickedCount++;
            }
          }
        };

        ClickableEntity.#MouseDownListeners.set(this.game, fn);
        this.inputs.on(MouseDown, fn);
      }

      if (!ClickableEntity.#MouseUpListeners.has(this.game)) {
        const fn = ({ button, cursor }: MouseUp) => {
          const entities = this.game.entities.lookupByType(ClickableEntity);
          for (const entity of entities) entity[clickedSetter](false, button, cursor);
        };

        ClickableEntity.#MouseUpListeners.set(this.game, fn);
        this.inputs.on(MouseUp, fn);
      }
    }
  }

  protected abstract isInBounds(worldPosition: Vector2): boolean;
}

export class ClickableRect extends ClickableEntity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "👆";
  get bounds(): Readonly<IVector2> | undefined {
    // TODO: Reuse the same vector
    return new Vector2(this.width, this.height);
  }

  width: number = 1;
  height: number = 1;

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(ClickableRect, "width", "height");
  }

  public isInBounds(worldPosition: Vector2): boolean {
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);

    return (
      localPosition.x >= this.width / -2 &&
      localPosition.x <= this.width / 2 &&
      localPosition.y >= this.height / -2 &&
      localPosition.y <= this.height / 2
    );
  }
}

export class ClickableCircle extends ClickableEntity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "👆";
  get bounds(): Readonly<IVector2> | undefined {
    const size = this.radius * 2;
    return new Vector2(size, size);
  }

  radius: number = 1;
  innerRadus: number = 0;

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(ClickableCircle, "radius", "innerRadus");
  }

  public isInBounds(worldPosition: Vector2): boolean {
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);

    const radiusSq = this.radius * this.radius;
    const innerSq = this.innerRadus * this.innerRadus;
    const distanceSq = localPosition.magnitudeSquared();

    return distanceSq >= innerSq && distanceSq <= radiusSq;
  }
}
