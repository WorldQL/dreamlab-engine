import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Transform, Vector2 } from "../../math/mod.ts";
import { pointLocalToWorld, pointWorldToLocal } from "../../math/spatial-transforms.ts";
import { EntityDestroyed, GameRender, MouseDown } from "../../signals/mod.ts";
import type { EntityContext } from "../entity.ts";
import { Entity } from "../entity.ts";
import { Camera } from "./camera.ts";
import { ClickableRect } from "./clickable.ts";
import { Empty } from "./empty.ts";
import { SolidColor } from "./solid-color.ts";

type Handle = Exclude<`${"t" | "b" | ""}${"l" | "" | "r"}`, "">;

// TODO: implement rotation handle logic
// TODO: make work when rotated lol
export class BoxResizeGizmo extends Entity {
  static {
    Entity.registerType(this, "@editor");
  }

  readonly bounds: undefined;

  static readonly #STROKE_WIDTH = 5 / 100;
  static readonly #CLICK_WIDTH = BoxResizeGizmo.#STROKE_WIDTH * 2.5;
  static readonly #CORNER_WIDTH = BoxResizeGizmo.#CLICK_WIDTH * 1.25;
  static readonly #ROTATE_OFFSET = 0.25;
  static readonly #STROKE_COLOR = 0x22a2ff;

  static readonly #__DEBUG__ = false;

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
  #calculateGripSizes(scaled: IVector2): IVector2 {
    const offset = BoxResizeGizmo.#CORNER_WIDTH / 2;
    return {
      x: scaled.x - offset,
      y: scaled.y - offset,
    };
  }

  #calculateHandlePositions(
    scaled: IVector2,
  ): Record<`${"t" | "b"}${"l" | "r"}` | "rot", IVector2> {
    const offset = BoxResizeGizmo.#CORNER_WIDTH / 1.5;
    const pos: IVector2 = {
      x: scaled.x / 2 - BoxResizeGizmo.#STROKE_WIDTH + offset,
      y: scaled.y / 2 - BoxResizeGizmo.#STROKE_WIDTH + offset,
    };

    return {
      tl: { x: -pos.x, y: pos.y },
      tr: { x: pos.x, y: pos.y },
      bl: { x: -pos.x, y: -pos.y },
      br: { x: pos.x, y: -pos.y },
      rot: { x: 0, y: scaled.y / 2 + BoxResizeGizmo.#ROTATE_OFFSET },
    };
  }

  #updateHandles() {
    // Destroy existing chilldren
    this.children.forEach(c => c.destroy());

    // Don't spawn handles if no target entity or no bounds
    const entity = this.#target;
    if (!entity) return;
    const bounds = entity.bounds;
    if (!bounds) return;
    const scaled = Vector2.mul(bounds, entity.globalTransform.scale);

    const container = this.spawn({ type: Empty, name: "Container" });

    const __debug__ = (color: string, ...clickables: ClickableRect[]) => {
      if (!BoxResizeGizmo.#__DEBUG__) return;
      for (const clickable of clickables) {
        const width = clickable.width;
        const height = clickable.height;

        clickable.spawn({
          type: SolidColor,
          name: "__DEBUG__",
          transform: { z: Number.MAX_SAFE_INTEGER },
          values: { width, height, color },
        });
      }
    };

    const grip = this.#calculateGripSizes(scaled);

    const leftEdge = container.spawn({
      type: ClickableRect,
      name: "LeftEdge",
      transform: {
        z: 999_999,
        position: { x: -(scaled.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2), y: 0 },
      },
      values: { width: BoxResizeGizmo.#CLICK_WIDTH, height: grip.y },
    });

    const rightEdge = container.spawn({
      type: ClickableRect,
      name: "RightEdge",
      transform: {
        z: 999_999,
        position: { x: scaled.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2, y: 0 },
      },
      values: { width: BoxResizeGizmo.#CLICK_WIDTH, height: grip.y },
    });

    const topEdge = container.spawn({
      type: ClickableRect,
      name: "TopEdge",
      transform: {
        z: 999_999,
        position: { x: 0, y: scaled.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2 },
      },
      values: { width: grip.x, height: BoxResizeGizmo.#CLICK_WIDTH },
    });

    const bottomEdge = container.spawn({
      type: ClickableRect,
      name: "BottomEdge",
      transform: {
        z: 999_999,
        position: { x: 0, y: -(scaled.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2) },
      },
      values: { width: grip.x, height: BoxResizeGizmo.#CLICK_WIDTH },
    });

    const handles = this.#calculateHandlePositions(scaled);
    const handleValues = {
      width: BoxResizeGizmo.#CORNER_WIDTH * 1.2,
      height: BoxResizeGizmo.#CORNER_WIDTH * 1.2,
    };

    const topLeft = container.spawn({
      type: ClickableRect,
      name: "TopLeft",
      transform: {
        z: 1_000_000,
        position: handles.tl,
      },
      values: handleValues,
    });

    const topRight = container.spawn({
      type: ClickableRect,
      name: "TopRight",
      transform: {
        z: 1_000_000,
        position: handles.tr,
      },
      values: handleValues,
    });

    const bottomLeft = container.spawn({
      type: ClickableRect,
      name: "BottomLeft",
      transform: {
        z: 1_000_000,
        position: handles.bl,
      },
      values: handleValues,
    });

    const bottomRight = container.spawn({
      type: ClickableRect,
      name: "BottomRight",
      transform: {
        z: 1_000_000,
        position: handles.br,
      },
      values: handleValues,
    });

    const rotate = container.spawn({
      type: ClickableRect,
      name: "Rotate",
      transform: {
        z: 1_000_000,
        position: handles.rot,
      },
      values: handleValues,
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

    __debug__("#ff0000af", leftEdge, rightEdge, topEdge, bottomEdge);
    __debug__("#00ff00af", topLeft, topRight, bottomLeft, bottomRight);
    __debug__("#ff00ffaf", rotate);
  }

  #updateHandlePositions(camera: Camera) {
    // We dont want the handle sizes to change with scale

    const entity = this.#target;
    if (!entity) return;
    const bounds = entity.bounds;
    if (!bounds) return;
    const scaled = Vector2.div(
      Vector2.mul(bounds, entity.globalTransform.scale),
      camera.smoothed.scale,
    );

    const container = this.children.get("Container")?.cast(Empty);
    if (container) container.globalTransform.rotation = entity.globalTransform.rotation;

    const __debug__ = (...clickables: (ClickableRect | undefined)[]) => {
      if (!BoxResizeGizmo.#__DEBUG__) return;
      for (const clickable of clickables) {
        if (!clickable) continue;
        const debug = clickable?.children.get("__DEBUG__") as
          | { width: number; height: number }
          | undefined;

        if (!debug) continue;
        debug.width = clickable.width;
        debug.height = clickable.height;
      }
    };

    const grip = this.#calculateGripSizes(scaled);
    const handles = this.#calculateHandlePositions(scaled);

    const leftEdge = container?.children.get("LeftEdge")?.cast(ClickableRect);
    if (leftEdge) {
      leftEdge.height = grip.y;
      leftEdge.transform.position.x = -(scaled.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2);
    }

    const rightEdge = container?.children.get("RightEdge")?.cast(ClickableRect);
    if (rightEdge) {
      rightEdge.height = grip.y;
      rightEdge.transform.position.x = scaled.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2;
    }

    const topEdge = container?.children.get("TopEdge")?.cast(ClickableRect);
    if (topEdge) {
      topEdge.width = grip.x;
      topEdge.transform.position.y = scaled.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2;
    }

    const bottomEdge = container?.children.get("BottomEdge")?.cast(ClickableRect);
    if (bottomEdge) {
      bottomEdge.width = grip.x;
      bottomEdge.transform.position.y = -(scaled.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2);
    }

    const topLeft = container?.children.get("TopLeft")?.cast(ClickableRect);
    if (topLeft) topLeft.transform.position.assign(handles.tl);

    const topRight = container?.children.get("TopRight")?.cast(ClickableRect);
    if (topRight) topRight.transform.position.assign(handles.tr);

    const bottomLeft = container?.children.get("BottomLeft")?.cast(ClickableRect);
    if (bottomLeft) bottomLeft.transform.position.assign(handles.bl);

    const bottomRight = container?.children.get("BottomRight")?.cast(ClickableRect);
    if (bottomRight) bottomRight.transform.position.assign(handles.br);

    const rotate = container?.children.get("Rotate")?.cast(ClickableRect);
    if (rotate) rotate.transform.position.assign(handles.rot);

    __debug__(
      leftEdge,
      rightEdge,
      topEdge,
      bottomEdge,
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
    );
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
    if (!cursor.world) return;

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

      const camera = Camera.getActive(this.game);
      if (!camera) return;
      this.#gfx.scale = camera.smoothed.scale;
      this.globalTransform.scale = camera.smoothed.scale;

      const entity = this.#target;
      if (!entity) return;

      const pos = entity.pos;
      this.pos.assign(entity.pos);

      const _bounds = entity.bounds;
      if (!_bounds) return;
      const bounds = Vector2.div(
        Vector2.mul(_bounds, entity.globalTransform.scale),
        camera.smoothed.scale,
      );

      this.#updateHandlePositions(camera);

      const halfx = bounds.x / 2;
      const halfy = bounds.y / 2;

      const a = { x: -halfx, y: halfy };
      const b = { x: -halfx, y: -halfy };
      const c = { x: halfx, y: halfy };
      const d = { x: halfx, y: -halfy };

      this.#gfx.position = { x: pos.x, y: -pos.y };
      this.#gfx.rotation = -entity.globalTransform.rotation;

      const STROKE = {
        width: BoxResizeGizmo.#STROKE_WIDTH,
        color: BoxResizeGizmo.#STROKE_COLOR,
        alpha: 1,
        alignment: -0,
      } satisfies PIXI.StrokeInput;

      const HANDLE_STROKE = { ...STROKE, width: STROKE.width / 2 } satisfies PIXI.StrokeInput;
      const CORNER_SIZE = BoxResizeGizmo.#STROKE_WIDTH * 2;

      const CORNER_X_POS = halfx - BoxResizeGizmo.#STROKE_WIDTH / 2;
      const CORNER_Y_POS = halfy - BoxResizeGizmo.#STROKE_WIDTH / 2;
      const CORNER_X_NEG = -halfx - BoxResizeGizmo.#STROKE_WIDTH / 2 - CORNER_SIZE / 2;
      const CORNER_Y_NEG = -halfy - BoxResizeGizmo.#STROKE_WIDTH / 2 - CORNER_SIZE / 2;

      this.#gfx.context
        .moveTo(0, -halfy)
        .lineTo(0, -halfy - BoxResizeGizmo.#ROTATE_OFFSET)
        .stroke({ ...STROKE, alignment: 0.5, width: STROKE.width / 2 })
        .poly([a, b, d, c])
        .stroke(STROKE)
        .rect(CORNER_X_POS, CORNER_Y_POS, CORNER_SIZE, CORNER_SIZE)
        .fill("white")
        .stroke(HANDLE_STROKE)
        .rect(CORNER_X_POS, CORNER_Y_NEG, CORNER_SIZE, CORNER_SIZE)
        .fill("white")
        .stroke(HANDLE_STROKE)
        .rect(CORNER_X_NEG, CORNER_Y_POS, CORNER_SIZE, CORNER_SIZE)
        .fill("white")
        .stroke(HANDLE_STROKE)
        .rect(CORNER_X_NEG, CORNER_Y_NEG, CORNER_SIZE, CORNER_SIZE)
        .fill("white")
        .stroke(HANDLE_STROKE)
        .scale(0.01)
        .circle(0, (-halfy - BoxResizeGizmo.#ROTATE_OFFSET) / 0.01, 5)
        .fill("white")
        .stroke(HANDLE_STROKE)
        .scale(1 / 0.01)
        .rect(-0.15, -0.15, 0.3, 0.3)
        .fill({ alpha: 0.2, color: "blue" })
        .stroke({ alpha: 0.5, color: "blue", width: 0.01 });
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
