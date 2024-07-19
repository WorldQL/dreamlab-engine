import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Vector2 } from "../../math/mod.ts";
import { pointLocalToWorld, pointWorldToLocal } from "../../math/spatial-transforms.ts";
import { exclusiveSignalType } from "../../signal.ts";
import { EntityDestroyed, GameRender, MouseDown } from "../../signals/mod.ts";
import type { EntityContext } from "../entity.ts";
import { Entity } from "../entity.ts";
import { Camera } from "./camera.ts";
import { ClickableCircle, ClickableRect } from "./clickable.ts";

// #region Signals
// #region Translate
export class GizmoTranslateStart {
  constructor(public readonly axis: "x" | "y" | "both") {}
  [exclusiveSignalType] = Gizmo;
}

export class GizmoTranslateMove {
  constructor(public readonly position: Vector2) {}
  [exclusiveSignalType] = Gizmo;
}

export class GizmoTranslateEnd {
  [exclusiveSignalType] = Gizmo;
}
// #endregion

// #region Rotate
export class GizmoRotateStart {
  [exclusiveSignalType] = Gizmo;
}

export class GizmoRotateMove {
  constructor(public readonly rotation: number) {}
  [exclusiveSignalType] = Gizmo;
}

export class GizmoRotateEnd {
  [exclusiveSignalType] = Gizmo;
}
// #endregion

// #region Scale
export class GizmoScaleStart {
  constructor(public readonly axis: "x" | "y" | "both") {}
  [exclusiveSignalType] = Gizmo;
}

export class GizmoScaleMove {
  constructor(public readonly scale: Vector2) {}
  [exclusiveSignalType] = Gizmo;
}

export class GizmoScaleEnd {
  [exclusiveSignalType] = Gizmo;
}
// #endregion
// #endregion

export class Gizmo extends Entity {
  public static readonly icon = "➡️";

  // #region Graphics
  static #X_COLOR = "red";
  static #Y_COLOR = "green";
  static #Z_COLOR = "blue";
  static #NEUTRAL_COLOR = "gray";

  static #ARROW_W = 0.1;
  static #ARROW_H = 0.15;
  static #SCALE_S = 0.15;

  static #blankCtx = new PIXI.GraphicsContext();

  static #translateCtx = new PIXI.GraphicsContext()
    .moveTo(0, 0)
    .lineTo(1, 0)
    .stroke({ color: Gizmo.#X_COLOR, width: 0.02 })
    .moveTo(0, 0)
    .lineTo(0, -1)
    .stroke({ color: Gizmo.#Y_COLOR, width: 0.02 })
    .moveTo(0.2, 0.2)
    .rect(0.1, -0.4, 0.3, 0.3)
    .fill({ alpha: 0.2, color: Gizmo.#Z_COLOR })
    .stroke({ alpha: 0.5, color: Gizmo.#Z_COLOR, width: 0.01 })
    .poly([1, Gizmo.#ARROW_W / 2, 1, -Gizmo.#ARROW_W / 2, 1 + Gizmo.#ARROW_H, 0])
    .fill(Gizmo.#X_COLOR)
    .poly([Gizmo.#ARROW_W / 2, -1, -Gizmo.#ARROW_W / 2, -1, 0, -1 - Gizmo.#ARROW_H])
    .fill(Gizmo.#Y_COLOR);

  static #rotateCtx = new PIXI.GraphicsContext()
    .moveTo(-1, 0)
    .lineTo(1, 0)
    .stroke({ color: Gizmo.#X_COLOR, width: 0.02, alpha: 0.6 })
    .moveTo(0, 1)
    .lineTo(0, -1)
    .stroke({ color: Gizmo.#Y_COLOR, width: 0.02, alpha: 0.6 })
    .scale(0.1)
    .circle(0, 0, 10)
    .stroke({ color: Gizmo.#NEUTRAL_COLOR, width: 0.02 });

  static #scaleCtx = new PIXI.GraphicsContext()
    .moveTo(0, 0)
    .lineTo(1, 0)
    .stroke({ color: Gizmo.#X_COLOR, width: 0.02 })
    .moveTo(0, 0)
    .lineTo(0, -1)
    .stroke({ color: Gizmo.#Y_COLOR, width: 0.02 })
    .moveTo(0.2, 0.2)
    .rect(1, -Gizmo.#SCALE_S / 2, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#X_COLOR)
    .rect(-Gizmo.#SCALE_S / 2, -1 - Gizmo.#SCALE_S, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#Y_COLOR)
    .rect(0.1, -0.4, 0.3, 0.3)
    .fill({ alpha: 0.2, color: Gizmo.#Z_COLOR })
    .stroke({ alpha: 0.5, color: Gizmo.#Z_COLOR, width: 0.01 });

  static #combinedCtx = new PIXI.GraphicsContext()
    // Lines
    .moveTo(0, 0)
    .lineTo(0.7, 0)
    .stroke({ color: Gizmo.#X_COLOR, width: 0.02 })
    .moveTo(0, 0)
    .lineTo(0, -0.7)
    .stroke({ color: Gizmo.#Y_COLOR, width: 0.02 })
    // Scale handles
    .rect(0.7, -Gizmo.#SCALE_S / 2, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#X_COLOR)
    .rect(-Gizmo.#SCALE_S / 2, -0.7 - Gizmo.#SCALE_S, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#Y_COLOR)
    // Move handles
    .poly([1.1, Gizmo.#ARROW_W / 2, 1.1, -Gizmo.#ARROW_W / 2, 1.1 + Gizmo.#ARROW_H, 0])
    .fill(Gizmo.#X_COLOR)
    .poly([Gizmo.#ARROW_W / 2, -1.1, -Gizmo.#ARROW_W / 2, -1.1, 0, -1.1 - Gizmo.#ARROW_H])
    .fill(Gizmo.#Y_COLOR)
    .moveTo(0, 0)
    .rect(-0.15, -0.15, 0.3, 0.3)
    .fill({ alpha: 0.2, color: Gizmo.#Z_COLOR })
    .stroke({ alpha: 0.5, color: Gizmo.#Z_COLOR, width: 0.01 })
    // Rotation circle
    .scale(0.1)
    .circle(0, 0, 10)
    .stroke({ color: Gizmo.#NEUTRAL_COLOR, width: 0.02 });

  #graphics: PIXI.Graphics | undefined;

  get #ctx() {
    if (!this.#target) return Gizmo.#blankCtx;

    if (this.mode === "translate") return Gizmo.#translateCtx;
    else if (this.mode === "rotate") return Gizmo.#rotateCtx;
    else if (this.mode === "scale") return Gizmo.#scaleCtx;
    else if (this.mode === "combined") return Gizmo.#combinedCtx;
    else throw new Error("invalid mode");
  }
  // #endregion

  // #region Mode
  #mode: "translate" | "rotate" | "scale" | "combined" = "combined";
  get mode() {
    return this.#mode;
  }
  set mode(value) {
    this.#mode = value;
    if (this.#graphics) this.#graphics.context = this.#ctx;
    this.#updateHandles();
  }
  // #endregion

  // #region Handles
  #updateHandles() {
    // Destroy existing chilldren
    this.children.forEach(c => c.destroy());

    // Don't spawn handles if no target entity
    if (!this.#target) return;

    if (this.mode === "translate") this.#translateHandles();
    else if (this.mode === "rotate") this.#rotateHandles();
    else if (this.mode === "scale") this.#scaleHandles();
    else if (this.mode === "combined") this.#combinedHandles();
    else throw new Error("invalid mode");
  }

  #translateHandles() {
    const handleSize = Math.max(Gizmo.#ARROW_W, Gizmo.#ARROW_H);
    const clickSize = handleSize * 1.333;

    const translateX = this.spawn({
      type: ClickableRect,
      name: "TranslateX",
      transform: { position: { x: 1 + handleSize / 2, y: 0 } },
      values: { width: clickSize, height: clickSize },
    });

    const translateY = this.spawn({
      type: ClickableRect,
      name: "TranslateY",
      transform: { position: { x: 0, y: 1 + handleSize / 2 } },
      values: { width: clickSize, height: clickSize },
    });

    const translateBoth = this.spawn({
      type: ClickableRect,
      name: "TranslateBoth",
      transform: { position: { x: 0.25, y: 0.25 } },
      values: { width: 0.3, height: 0.3 },
    });

    const onMouseDown =
      (axis: "x" | "y" | "both") =>
      ({ button, world }: MouseDown) => {
        if (button !== "left") return;

        const offset = world.sub(this.globalTransform.position);
        this.#action = { type: "translate", axis, offset };
        this.fire(GizmoTranslateStart, axis);
      };

    translateX.on(MouseDown, onMouseDown("x"));
    translateY.on(MouseDown, onMouseDown("y"));
    translateBoth.on(MouseDown, onMouseDown("both"));
  }

  #rotateHandles() {
    const width = 0.4;

    const rotate = this.spawn({
      type: ClickableCircle,
      name: "Rotate",
      values: { radius: 1 + width / 2, innerRadus: 1 - width / 2 },
    });

    rotate.on(MouseDown, ({ button, world }) => {
      if (button !== "left") return;

      const pos = world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);

      this.#action = { type: "rotate", offset: rot + this.globalTransform.rotation };
      this.fire(GizmoRotateStart);
    });
  }

  #scaleHandles() {
    const handleSize = Gizmo.#SCALE_S;
    const clickSize = handleSize * 1.333;

    const scaleX = this.spawn({
      type: ClickableRect,
      name: "ScaleX",
      transform: { position: { x: 1 + handleSize / 2, y: 0 } },
      values: { width: clickSize, height: clickSize },
    });

    const scaleY = this.spawn({
      type: ClickableRect,
      name: "ScaleY",
      transform: { position: { x: 0, y: 1 + handleSize / 2 } },
      values: { width: clickSize, height: clickSize },
    });

    const scaleBoth = this.spawn({
      type: ClickableRect,
      name: "ScaleBoth",
      transform: { position: { x: 0.25, y: 0.25 } },
      values: { width: 0.3, height: 0.3 },
    });

    const onMouseDown =
      (axis: "x" | "y" | "both") =>
      ({ button, world }: MouseDown) => {
        if (button !== "left") return;

        const offset = world.sub(this.globalTransform.position);
        const original = this.#target!.globalTransform.scale.clone();
        this.#action = { type: "scale", axis, offset, original };
        this.fire(GizmoScaleStart, axis);
      };

    scaleX.on(MouseDown, onMouseDown("x"));
    scaleY.on(MouseDown, onMouseDown("y"));
    scaleBoth.on(MouseDown, onMouseDown("both"));
  }

  #combinedHandles() {
    const translateHandleSize = Math.max(Gizmo.#ARROW_W, Gizmo.#ARROW_H);
    const translateClickSize = translateHandleSize * 1.333;

    const translateX = this.spawn({
      type: ClickableRect,
      name: "TranslateX",
      transform: { position: { x: 1.1 + translateHandleSize / 2, y: 0 } },
      values: { width: translateClickSize, height: translateClickSize },
    });

    const translateY = this.spawn({
      type: ClickableRect,
      name: "TranslateY",
      transform: { position: { x: 0, y: 1.1 + translateHandleSize / 2 } },
      values: { width: translateClickSize, height: translateClickSize },
    });

    const translateBoth = this.spawn({
      type: ClickableRect,
      name: "TranslateBoth",
      transform: { position: { x: 0, y: 0 } },
      values: { width: 0.3, height: 0.3 },
    });

    const rotate = this.spawn({
      type: ClickableCircle,
      name: "Rotate",
      values: { radius: 1.05, innerRadus: 0.95 },
    });

    const scaleHandleSize = Gizmo.#SCALE_S;
    const scaleClickSize = scaleHandleSize * 1.333;

    const scaleX = this.spawn({
      type: ClickableRect,
      name: "ScaleX",
      transform: { position: { x: 0.7 + scaleHandleSize / 2, y: 0 } },
      values: { width: scaleClickSize, height: scaleClickSize },
    });

    const scaleY = this.spawn({
      type: ClickableRect,
      name: "ScaleY",
      transform: { position: { x: 0, y: 0.7 + scaleHandleSize / 2 } },
      values: { width: scaleClickSize, height: scaleClickSize },
    });

    const translateOnMouseDown =
      (axis: "x" | "y" | "both") =>
      ({ button, world }: MouseDown) => {
        if (button !== "left") return;

        const offset = world.sub(this.globalTransform.position);
        this.#action = { type: "translate", axis, offset };
        this.fire(GizmoTranslateStart, axis);
      };

    translateX.on(MouseDown, translateOnMouseDown("x"));
    translateY.on(MouseDown, translateOnMouseDown("y"));
    translateBoth.on(MouseDown, translateOnMouseDown("both"));

    rotate.on(MouseDown, ({ button, world }) => {
      if (button !== "left") return;

      const pos = world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);

      this.#action = { type: "rotate", offset: rot + this.globalTransform.rotation };
      this.fire(GizmoRotateStart);
    });

    const scaleOnMouseDown =
      (axis: "x" | "y" | "both") =>
      ({ button, world }: MouseDown) => {
        if (button !== "left") return;

        const offset = world.sub(this.globalTransform.position);
        const original = this.#target!.globalTransform.scale.clone();
        this.#action = { type: "scale", axis, offset, original };
        this.fire(GizmoScaleStart, axis);
      };

    scaleX.on(MouseDown, scaleOnMouseDown("x"));
    scaleY.on(MouseDown, scaleOnMouseDown("y"));
  }
  // #endregion

  // #region Action / Signals
  #action:
    | { type: "translate"; axis: "x" | "y" | "both"; offset: Vector2 }
    | { type: "rotate"; offset: number }
    | { type: "scale"; axis: "x" | "y" | "both"; offset: Vector2; original: Vector2 }
    | undefined;

  #onMouseMove = (_: MouseEvent) => {
    if (!this.#target) return;
    if (!this.#action) return;

    const cursor = this.inputs.cursor;
    if (!cursor) return;

    if (this.#action.type === "translate") {
      const pos = cursor.world.sub(this.#action.offset);

      const local = pointWorldToLocal(this.globalTransform, pos);
      if (this.#action.axis === "x") local.y = 0;
      if (this.#action.axis === "y") local.x = 0;
      const world = pointLocalToWorld(this.globalTransform, local);

      this.fire(GizmoTranslateMove, world);
      this.#target.globalTransform.position = world;
    } else if (this.#action.type === "rotate") {
      const pos = cursor.world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);

      const rotation = -rot + this.#action.offset;
      this.fire(GizmoRotateMove, rotation);
      this.#target.globalTransform.rotation = rotation;
    } else if (this.#action.type === "scale") {
      const originalDistance = this.#action.offset.magnitude();
      const offset = cursor.world.sub(this.globalTransform.position);
      const offsetDistance = offset.magnitude();

      const mul = Vector2.splat(offsetDistance / originalDistance);
      if (this.#action.axis === "x") mul.y = 1;
      if (this.#action.axis === "y") mul.x = 1;
      const scale = this.#action.original.mul(mul);

      this.fire(GizmoScaleMove, scale);
      this.#target.globalTransform.scale = scale;
    }
  };

  #onMouseUp = (_: MouseEvent) => {
    if (!this.#action) return;

    if (this.#action.type === "translate") {
      this.fire(GizmoTranslateEnd);
    } else if (this.#action.type === "rotate") {
      this.fire(GizmoRotateEnd);
    } else if (this.#action.type === "scale") {
      this.fire(GizmoScaleEnd);
    }

    this.#action = undefined;
  };
  // #endregion

  #target: Entity | undefined;
  get target(): Entity | undefined {
    return this.#target;
  }
  set target(value: Entity | undefined) {
    this.#target = value;
    if (this.#graphics) this.#graphics.context = this.#ctx;
    this.#updateHandles();
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    // Must be a local entity
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error("camera must be spawned as a client local");
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#graphics) return;

      if (this.#target) {
        this.globalTransform.position = this.#target.globalTransform.position;
        this.globalTransform.rotation = this.#target.globalTransform.rotation;
      }

      const pos = this.globalTransform.position;
      const rotation = this.globalTransform.rotation;

      this.#graphics.position = { x: pos.x, y: -pos.y };
      this.#graphics.rotation = -rotation;

      const camera = Camera.getActive(this.game);
      if (camera) {
        this.#graphics.scale = camera.smoothed.scale;
        this.globalTransform.scale = camera.smoothed.scale;
      } else {
        this.#graphics.scale = 1;
      }
    });

    this.on(EntityDestroyed, () => {
      this.#graphics?.destroy();

      if (this.game.isClient()) {
        const canvas = this.game.renderer.app.canvas;
        canvas.removeEventListener("mousemove", this.#onMouseMove);
        canvas.removeEventListener("mouseup", this.#onMouseUp);
      }
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    this.#graphics = new PIXI.Graphics(this.#ctx);
    this.#graphics.zIndex = 9999999999;
    this.game.renderer.scene.addChild(this.#graphics);

    this.#updateHandles();

    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("mousemove", this.#onMouseMove);
    canvas.addEventListener("mouseup", this.#onMouseUp);
  }
}
Entity.registerType(Gizmo, "@core");
