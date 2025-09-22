import type { ClientGame, Value } from "@dreamlab/engine";
import {
  Bounds,
  Click,
  Cursor,
  Entity,
  EntityContext,
  GameRender,
  IBounds,
  MouseDown,
  MouseOut,
  MouseOver,
  MouseUp,
  Vector2,
  enumAdapter,
  pointWorldToLocal,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

const clickedSetter = Symbol.for("dreamlab.internal.clickable.clicked-setter");
const hoverSetter = Symbol.for("dreamlab.internal.clickable.hover-setter");

export abstract class ClickableEntity extends Entity {
  #clicked: boolean = false;
  get clicked(): boolean {
    return this.#clicked;
  }
  [clickedSetter](
    value: boolean,
    button: "left" | "right" | "middle",
    cursor: Cursor,
    ev: MouseDown["ev"],
  ) {
    const prev = this.#clicked;
    this.#clicked = value;

    if (!prev && value) {
      const x = { screen: cursor.screen!, world: cursor.world! };
      this.fire(MouseDown, button, x, ev);
      this.behaviors.forEach(b => b.onMouseDown?.(button));
      if (button === "left") this.fire(Click, x);
    } else if (prev && !value) {
      this.fire(MouseUp, button, cursor, ev);
      this.behaviors.forEach(b => b.onMouseUp?.(button));
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

  static #GameRenderListeners = new Map<ClientGame, (ev: GameRender) => void>();
  static #MouseDownListeners = new Map<ClientGame, (ev: MouseDown) => void>();
  static #MouseUpListeners = new Map<ClientGame, (ev: MouseUp) => void>();

  constructor(ctx: EntityContext) {
    super(ctx);

    if (this.game.isClient()) {
      if (!ClickableEntity.#GameRenderListeners.has(this.game)) {
        const canvas = this.game.renderer.app.canvas;

        // TODO: Make z sorting optional
        const fn = (_: GameRender) => {
          const cursor = this.inputs.cursor;
          const entities = this.game.entities
            .lookupByType(ClickableEntity)
            .filter(entity => entity.enabled)
            .filter(entity => entity.root !== this.game.prefabs)
            .toSorted((a, b) => b.z - a.z);

          let hoverCount = 0;
          for (const entity of entities) {
            const isInBounds =
              hoverCount > 0
                ? false
                : ((cursor.world && entity.isInBounds(cursor.world)) ?? false);

            entity[hoverSetter](isInBounds, cursor);
            if (isInBounds) hoverCount++;
          }

          // Find the topmost hovered entity and use its cursor
          let topCursor = "";
          for (const entity of entities) {
            if (entity.hover) {
              const clickable = entity as Clickable;
              // Allow dynamic cursor calculation via getCursor method
              topCursor =
                (typeof clickable.getCursor === "function"
                  ? clickable.getCursor()
                  : clickable.cursor) || "pointer";
              break;
            }
          }
          canvas.style.cursor = topCursor;
        };

        ClickableEntity.#GameRenderListeners.set(this.game, fn);
        this.game.on(GameRender, fn);
      }

      if (!ClickableEntity.#MouseDownListeners.has(this.game)) {
        const fn = ({ button, cursor, ev }: MouseDown) => {
          const entities = this.game.entities
            .lookupByType(ClickableEntity)
            .filter(entity => entity.enabled)
            .filter(entity => entity.root !== this.game.prefabs)
            .toSorted((a, b) => b.z - a.z);

          let clickedCount = 0;
          for (const entity of entities) {
            const isInBounds = clickedCount > 0 ? false : entity.isInBounds(cursor.world);
            if (isInBounds) {
              entity[clickedSetter](true, button, cursor, ev);
              clickedCount++;
            }
          }
        };

        ClickableEntity.#MouseDownListeners.set(this.game, fn);
        this.inputs.on(MouseDown, fn);
      }

      if (!ClickableEntity.#MouseUpListeners.has(this.game)) {
        const fn = ({ button, cursor, ev }: MouseUp) => {
          const entities = this.game.entities
            .lookupByType(ClickableEntity)
            .filter(entity => entity.enabled)
            .filter(entity => entity.root !== this.game.prefabs);

          for (const entity of entities) entity[clickedSetter](false, button, cursor, ev);
        };

        ClickableEntity.#MouseUpListeners.set(this.game, fn);
        this.inputs.on(MouseUp, fn);
      }
    }
  }

  public abstract isInBounds(worldPosition: Vector2): boolean;

  static [internal.clickableTeardownGame](game: ClientGame) {
    ClickableEntity.#GameRenderListeners.delete(game);
    ClickableEntity.#MouseDownListeners.delete(game);
    ClickableEntity.#MouseUpListeners.delete(game);
  }
}

type ClickableShape = enumAdapter.Union<typeof ClickableShapeAdapter>;
const ClickableShapeAdapter = enumAdapter(["Rectangle", "Circle"]);

export class Clickable extends ClickableEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "👆";
  get bounds(): IBounds | undefined {
    if (this.shape === "Rectangle") {
      return new Bounds(this.width, this.height);
    } else if (this.shape === "Circle") {
      const size = this.radius * 2;
      return new Bounds(size, size);
    } else {
      return undefined;
    }
  }

  active: boolean = true;
  shape: ClickableShape = "Rectangle";
  width: number = 1;
  height: number = 1;
  radius: number = 0.5;
  innerRadius: number = 0;
  cursor: string = "pointer";

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(Clickable, "active", {
      description: "Whether the entity can currently be clicked or hovered.",
    });
    this.defineValue(Clickable, "shape", {
      type: ClickableShapeAdapter,
      description: "Shape used to determine clickable bounds.",
    });

    const isRect: Value["hidden"] = values => values.get("shape")?.value !== "Rectangle";
    this.defineValue(Clickable, "width", {
      hidden: isRect,
      description: "Width of the clickable rectangle.",
    });
    this.defineValue(Clickable, "height", {
      hidden: isRect,
      description: "Height of the clickable rectangle.",
    });

    const isCircle: Value["hidden"] = values => values.get("shape")?.value !== "Circle";
    this.defineValue(Clickable, "radius", {
      hidden: isCircle,
      description: "Radius of the clickable circle.",
    });
    this.defineValue(Clickable, "innerRadius", {
      hidden: isCircle,
      description: "Optional inner radius to create a ring-shaped clickable area.",
    });
    this.defineValue(Clickable, "cursor", {
      description: "CSS cursor to display when hovering over this clickable area.",
    });
  }

  public isInBounds(worldPosition: Vector2): boolean {
    if (!this.active) return false;
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);

    if (this.shape === "Rectangle") {
      return (
        localPosition.x >= this.width / -2 &&
        localPosition.x <= this.width / 2 &&
        localPosition.y >= this.height / -2 &&
        localPosition.y <= this.height / 2
      );
    } else if (this.shape === "Circle") {
      const radiusSq = this.radius * this.radius;
      const innerSq = this.innerRadius * this.innerRadius;
      const distanceSq = localPosition.magnitudeSquared();

      return distanceSq >= innerSq && distanceSq <= radiusSq;
    } else {
      return false;
    }
  }

  // Optional method for dynamic cursor calculation
  getCursor?(): string;
}

/**
 * @deprecated Use {@link Clickable} with shape set to `Rectangle` instead.
 */
export class ClickableRect extends ClickableEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "👆";
  get bounds(): IBounds | undefined {
    // TODO: Reuse the same object
    return new Bounds(this.width, this.height);
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

/** @deprecated */
export class ClickableCircle extends ClickableEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "👆";
  get bounds(): IBounds | undefined {
    // TODO: Reuse the same object
    const size = this.radius * 2;
    return new Bounds(size, size);
  }

  radius: number = 1;
  innerRadius: number = 0;

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(ClickableCircle, "radius", "innerRadius");
  }

  public isInBounds(worldPosition: Vector2): boolean {
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);

    const radiusSq = this.radius * this.radius;
    const innerSq = this.innerRadius * this.innerRadius;
    const distanceSq = localPosition.magnitudeSquared();

    return distanceSq >= innerSq && distanceSq <= radiusSq;
  }
}
