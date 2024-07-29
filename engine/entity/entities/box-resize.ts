import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Transform, Vector2 } from "../../math/mod.ts";
import { pointLocalToWorld, pointWorldToLocal } from "../../math/spatial-transforms.ts";
import { EntityDestroyed, GameRender, MouseDown } from "../../signals/mod.ts";
import type { EntityContext } from "../entity.ts";
import { Entity } from "../entity.ts";
import { ClickableRect } from "./clickable.ts";

type Handle = Exclude<`${"t" | "b" | ""}${"l" | "" | "r"}`, "">;

// TODO: Make work when rotated lol
// TODO: Add handle to center for dragging

export class BoxResizeGizmo extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  readonly bounds: undefined;

  static readonly #STROKE_WIDTH = 5 / 100;
  static readonly #CLICK_WIDTH = BoxResizeGizmo.#STROKE_WIDTH * 2.5;
  static readonly #CORNER_WIDTH = BoxResizeGizmo.#CLICK_WIDTH * 1.25;

  #gfx: PIXI.Graphics | undefined;

  #target: Entity | undefined;
  get target(): Entity | undefined {
    return this.#target;
  }
  set target(value: Entity | undefined) {
    this.#target = value;
    this.#updateHandles();
  }

  // #region Handles
  #updateHandles() {
    // Destroy existing chilldren
    this.children.forEach(c => c.destroy());

    // Don't spawn handles if no target entity or no bounds
    const entity = this.#target;
    if (!entity) return;
    const bounds = entity.bounds;
    if (!bounds) return;
    const scaled = Vector2.mul(bounds, entity.globalTransform.scale);

    const leftEdge = this.spawn({
      type: ClickableRect,
      name: "LeftEdge",
      transform: {
        z: 999_999,
        position: { x: -(scaled.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2), y: 0 },
      },
      values: { width: BoxResizeGizmo.#CLICK_WIDTH, height: scaled.y },
    });

    const rightEdge = this.spawn({
      type: ClickableRect,
      name: "RightEdge",
      transform: {
        z: 999_999,
        position: { x: scaled.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2, y: 0 },
      },
      values: { width: BoxResizeGizmo.#CLICK_WIDTH, height: scaled.y },
    });

    const topEdge = this.spawn({
      type: ClickableRect,
      name: "TopEdge",
      transform: {
        z: 999_999,
        position: { x: 0, y: scaled.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2 },
      },
      values: { width: scaled.x, height: BoxResizeGizmo.#CLICK_WIDTH },
    });

    const bottomEdge = this.spawn({
      type: ClickableRect,
      name: "BottomEdge",
      transform: {
        z: 999_999,
        position: { x: 0, y: -(scaled.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2) },
      },
      values: { width: scaled.x, height: BoxResizeGizmo.#CLICK_WIDTH },
    });

    const topLeft = this.spawn({
      type: ClickableRect,
      name: "TopLeft",
      transform: {
        z: 1_000_000,
        position: {
          x: -(scaled.x / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2),
          y: scaled.y / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2,
        },
      },
      values: { width: BoxResizeGizmo.#CORNER_WIDTH, height: BoxResizeGizmo.#CORNER_WIDTH },
    });

    const topRight = this.spawn({
      type: ClickableRect,
      name: "TopRight",
      transform: {
        z: 1_000_000,
        position: {
          x: scaled.x / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2,
          y: scaled.y / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2,
        },
      },
      values: { width: BoxResizeGizmo.#CORNER_WIDTH, height: BoxResizeGizmo.#CORNER_WIDTH },
    });

    const bottomLeft = this.spawn({
      type: ClickableRect,
      name: "BottomLeft",
      transform: {
        z: 1_000_000,
        position: {
          x: -(scaled.x / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2),
          y: -(scaled.y / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2),
        },
      },
      values: { width: BoxResizeGizmo.#CORNER_WIDTH, height: BoxResizeGizmo.#CORNER_WIDTH },
    });

    const bottomRight = this.spawn({
      type: ClickableRect,
      name: "BottomRight",
      transform: {
        z: 1_000_000,
        position: {
          x: scaled.x / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2,
          y: -(scaled.y / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2),
        },
      },
      values: { width: BoxResizeGizmo.#CORNER_WIDTH, height: BoxResizeGizmo.#CORNER_WIDTH },
    });

    const onMouseDown =
      (handle: Handle) =>
      ({ button, cursor: { world } }: MouseDown) => {
        if (button !== "left") return;

        const offset = world.sub(this.globalTransform.position);
        this.#action = {
          type: "scale",
          handle,
          offset,
          transform: new Transform(entity.transform),
          globalTransform: new Transform(entity.globalTransform),
        };
      };

    leftEdge.on(MouseDown, onMouseDown("l"));
    rightEdge.on(MouseDown, onMouseDown("r"));
    topEdge.on(MouseDown, onMouseDown("t"));
    bottomEdge.on(MouseDown, onMouseDown("b"));
    topLeft.on(MouseDown, onMouseDown("tl"));
    topRight.on(MouseDown, onMouseDown("tr"));
    bottomLeft.on(MouseDown, onMouseDown("bl"));
    bottomRight.on(MouseDown, onMouseDown("br"));

    const translateOnMouseDown =
      (axis: "x" | "y" | "both") =>
      ({ button, cursor: { world } }: MouseDown) => {
        if (button !== "left") return;

        const offset = world.sub(this.globalTransform.position);
        this.#action = { type: "translate", axis, offset };
      };

    const translateBoth = this.spawn({
      type: ClickableRect,
      name: "TranslateBoth",
      transform: { position: { x: 0, y: 0 } },
      values: { width: 0.3, height: 0.3 },
    });
    translateBoth.on(MouseDown, translateOnMouseDown("both"));
  }

  #updateHandlePositions() {
    // We dont want the handle sizes to change with scale

    const entity = this.#target;
    if (!entity) return;
    const bounds = entity.bounds;
    if (!bounds) return;
    const scaled = Vector2.mul(bounds, entity.globalTransform.scale);

    const leftEdge = this.children.get("LeftEdge")?.cast(ClickableRect);
    if (leftEdge) {
      leftEdge.height = scaled.y;
      leftEdge.transform.position.x = -(scaled.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2);
    }

    const rightEdge = this.children.get("RightEdge")?.cast(ClickableRect);
    if (rightEdge) {
      rightEdge.height = scaled.y;
      rightEdge.transform.position.x = scaled.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2;
    }

    const topEdge = this.children.get("TopEdge")?.cast(ClickableRect);
    if (topEdge) {
      topEdge.width = scaled.x;
      topEdge.transform.position.y = scaled.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2;
    }

    const bottomEdge = this.children.get("BottomEdge")?.cast(ClickableRect);
    if (bottomEdge) {
      bottomEdge.width = scaled.x;
      bottomEdge.transform.position.y = -(scaled.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2);
    }

    const topLeft = this.children.get("TopLeft")?.cast(ClickableRect);
    if (topLeft) {
      topLeft.transform.position.x = -(scaled.x / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2);
      topLeft.transform.position.y = scaled.y / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2;
    }

    const topRight = this.children.get("TopRight")?.cast(ClickableRect);
    if (topRight) {
      topRight.transform.position.x = scaled.x / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2;
      topRight.transform.position.y = scaled.y / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2;
    }

    const bottomLeft = this.children.get("BottomLeft")?.cast(ClickableRect);
    if (bottomLeft) {
      bottomLeft.transform.position.x = -(scaled.x / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2);
      bottomLeft.transform.position.y = -(scaled.y / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2);
    }

    const bottomRight = this.children.get("BottomRight")?.cast(ClickableRect);
    if (bottomRight) {
      bottomRight.transform.position.x = scaled.x / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2;
      bottomRight.transform.position.y = -(scaled.y / 2 + BoxResizeGizmo.#CORNER_WIDTH / 2);
    }
  }
  // #endregion

  // #region Action / Signals
  #action:
    | { type: "translate"; axis: "x" | "y" | "both"; offset: Vector2 }
    | {
        type: "scale";
        handle: Handle;
        offset: Vector2;
        transform: Transform;
        globalTransform: Transform;
      }
    | undefined;

  #onMouseMove = (_: MouseEvent) => {
    if (!this.#target) return;
    if (!this.#action) return;

    const cursor = this.inputs.cursor;
    if (!cursor) return;

    const pos = cursor.world.sub(this.#action.offset);
    if (this.#action.type === "translate") {
      const local = pointWorldToLocal(this.globalTransform, pos);
      if (this.#action.axis === "x") local.y = 0;
      if (this.#action.axis === "y") local.x = 0;
      const world = pointLocalToWorld(this.globalTransform, local);

      this.#target.globalTransform.position = world;

      return;
    }

    const local = pointWorldToLocal(this.#action.globalTransform, pos);
    const scaled = this.#action.transform.scale.mul(local);

    switch (this.#action.handle) {
      case "l": {
        this.#target.transform.scale.x = this.#action.transform.scale.x - scaled.x;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;

        break;
      }
      case "r": {
        this.#target.transform.scale.x = this.#action.transform.scale.x + scaled.x;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;

        break;
      }
      case "t": {
        this.#target.transform.scale.y = this.#action.transform.scale.y + scaled.y;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;

        break;
      }
      case "b": {
        this.#target.transform.scale.y = this.#action.transform.scale.y - scaled.y;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;

        break;
      }

      case "tl": {
        this.#target.transform.scale.x = this.#action.transform.scale.x - scaled.x;
        this.#target.transform.scale.y = this.#action.transform.scale.y + scaled.y;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;

        break;
      }
      case "tr": {
        const scaled = this.#action.transform.scale.mul(local);
        this.#target.transform.scale.x = this.#action.transform.scale.x + scaled.x;
        this.#target.transform.scale.y = this.#action.transform.scale.y + scaled.y;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;

        break;
      }
      case "bl": {
        const scaled = this.#action.transform.scale.mul(local);
        this.#target.transform.scale.x = this.#action.transform.scale.x - scaled.x;
        this.#target.transform.scale.y = this.#action.transform.scale.y - scaled.y;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;

        break;
      }
      case "br": {
        const scaled = this.#action.transform.scale.mul(local);
        this.#target.transform.scale.x = this.#action.transform.scale.x + scaled.x;
        this.#target.transform.scale.y = this.#action.transform.scale.y - scaled.y;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;

        break;
      }
    }
  };

  #onMouseUp = (_: MouseEvent) => {
    if (!this.#action) return;
    this.#action = undefined;
  };
  // #endregion

  constructor(ctx: EntityContext) {
    super(ctx);

    // Must be a local entity
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error(`${this.constructor.name} must be spawned as a local client entity`);
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#gfx) return;
      this.#gfx.clear();

      const entity = this.#target;
      if (!entity) return;

      const pos = entity.pos;
      this.pos.assign(entity.pos);

      const bounds = entity.bounds;
      if (!bounds) return;

      this.#updateHandlePositions();

      const halfx = bounds.x / 2;
      const halfy = bounds.y / 2;

      const a = pointLocalToWorld(entity.globalTransform, { x: -halfx, y: -halfy });
      const b = pointLocalToWorld(entity.globalTransform, { x: -halfx, y: halfy });
      const c = pointLocalToWorld(entity.globalTransform, { x: halfx, y: -halfy });
      const d = pointLocalToWorld(entity.globalTransform, { x: halfx, y: halfy });

      a.y = -a.y;
      b.y = -b.y;
      c.y = -c.y;
      d.y = -d.y;

      this.#gfx
        .poly([a, b, d, c])
        .stroke({
          width: BoxResizeGizmo.#STROKE_WIDTH,
          color: "22a2ff",
          alpha: 1,
          alignment: -0,
        })
        .rect(pos.x - 0.15, -(pos.y + 0.15), 0.3, 0.3)
        .fill({ alpha: 0.2, color: "blue" })
        .stroke({ alpha: 0.5, color: "blue", width: 0.01 });

      // TODO: Draw corner boxes
    });

    this.on(EntityDestroyed, () => {
      this.#gfx?.destroy();

      if (this.game.isClient()) {
        const canvas = this.game.renderer.app.canvas;
        canvas.removeEventListener("mousemove", this.#onMouseMove);
        canvas.removeEventListener("mouseup", this.#onMouseUp);
      }
    });
  }

  onInitialize(): void {
    if (!this.game.isClient()) return;

    this.#gfx = new PIXI.Graphics({ zIndex: 9999999999 });
    this.game.renderer.scene.addChild(this.#gfx);

    this.#updateHandles();

    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("mousemove", this.#onMouseMove);
    canvas.addEventListener("mouseup", this.#onMouseUp);
  }
}
