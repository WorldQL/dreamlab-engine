import * as PIXI from "@dreamlab/vendor/pixi.ts";
import * as internal from "../../internal.ts";
import { Vector2 } from "../../math/mod.ts";
import { pointLocalToWorld, pointWorldToLocal } from "../../math/spatial-transforms.ts";
import { EntityDestroyed, GameRender, MouseDown } from "../../signals/mod.ts";
import type { EntityContext } from "../entity.ts";
import { Entity } from "../entity.ts";
import { Camera } from "./camera.ts";
import { ClickableCircle, ClickableRect } from "./clickable.ts";

// #region Signals
// #region Translate
export class GizmoTranslateStart {
  constructor(public readonly entity: Entity, public readonly axis: "x" | "y" | "both") {}
}

export class GizmoTranslateMove {
  constructor(public readonly entity: Entity, public readonly position: Vector2) {}
}

export class GizmoTranslateEnd {
  constructor(
    public readonly entity: Entity,
    public readonly previous: Vector2,
    public readonly position: Vector2,
  ) {}
}
// #endregion

// #region Rotate
export class GizmoRotateStart {
  constructor(public readonly entity: Entity) {}
}

export class GizmoRotateMove {
  constructor(public readonly entity: Entity, public readonly rotation: number) {}
}

export class GizmoRotateEnd {
  constructor(
    public readonly entity: Entity,
    public readonly previous: number,
    public readonly rotation: number,
  ) {}
}
// #endregion

// #region Scale
export class GizmoScaleStart {
  constructor(public readonly entity: Entity, public readonly axis: "x" | "y" | "both") {}
}

export class GizmoScaleMove {
  constructor(public readonly entity: Entity, public readonly scale: Vector2) {}
}

export class GizmoScaleEnd {
  constructor(
    public readonly entity: Entity,
    public readonly previous: Vector2,
    public readonly scale: Vector2,
  ) {}
}
// #endregion
// #endregion

function isCamera(entity: Entity): entity is Camera {
  return internal.cameraMarker in entity && entity[internal.cameraMarker] === true;
}

export class Gizmo extends Entity {
  static {
    Entity.registerType(this, "@editor");
  }

  public static readonly icon = "➡️";
  static readonly SNAP_THRESHOLD = 0.3;
  static readonly POSITION_TOLERANCE = 0.001;

  // A small threshold to prevent jittery resnapping:
  static readonly DEAD_ZONE = 0.05;

  readonly bounds: undefined;

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

  #gfx: PIXI.Graphics | undefined;

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
    if (this.#gfx) this.#gfx.context = this.#ctx;
    this.#updateHandles();
  }
  // #endregion

  // #region Handles
  #updateHandles() {
    this.children.forEach(c => c.destroy());

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
      ({ button, cursor: { world } }: MouseDown) => {
        if (!this.#target) return;
        if (button !== "left") return;

        this.#clearSnapLines();
        const offset = world.sub(this.globalTransform.position);
        const original = this.#target.pos.clone();
        this.#action = { type: "translate", axis, offset, original };
        this.fire(GizmoTranslateStart, this.#target, axis);
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

    rotate.on(MouseDown, ({ button, cursor: { world } }) => {
      if (!this.#target) return;
      if (button !== "left") return;

      this.#clearSnapLines();
      const pos = world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);
      const original = this.#target.globalTransform.rotation;

      this.#action = { type: "rotate", offset: rot + this.globalTransform.rotation, original };
      this.fire(GizmoRotateStart, this.#target);
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
      ({ button, cursor: { world } }: MouseDown) => {
        if (!this.#target) return;
        if (button !== "left") return;

        this.#clearSnapLines();
        const offset = world.sub(this.globalTransform.position);
        const original = isCamera(this.#target)
          ? Vector2.splat(1 / this.#target.zoom)
          : this.#target.globalTransform.scale.clone();

        this.#action = { type: "scale", axis, offset, original };
        this.fire(GizmoScaleStart, this.#target, axis);
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
      ({ button, cursor: { world } }: MouseDown) => {
        if (!this.#target) return;
        if (button !== "left") return;

        this.#clearSnapLines();
        const offset = world.sub(this.globalTransform.position);
        const original = this.#target.pos.clone();
        this.#action = { type: "translate", axis, offset, original };
        this.fire(GizmoTranslateStart, this.#target, axis);
      };

    translateX.on(MouseDown, translateOnMouseDown("x"));
    translateY.on(MouseDown, translateOnMouseDown("y"));
    translateBoth.on(MouseDown, translateOnMouseDown("both"));

    rotate.on(MouseDown, ({ button, cursor: { world } }) => {
      if (!this.#target) return;
      if (button !== "left") return;

      this.#clearSnapLines();
      const pos = world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);
      const original = this.#target.globalTransform.rotation;

      this.#action = { type: "rotate", offset: rot + this.globalTransform.rotation, original };
      this.fire(GizmoRotateStart, this.#target);
    });

    const scaleOnMouseDown =
      (axis: "x" | "y" | "both") =>
      ({ button, cursor: { world } }: MouseDown) => {
        if (!this.#target) return;
        if (button !== "left") return;

        this.#clearSnapLines();
        const offset = world.sub(this.globalTransform.position);
        const original = isCamera(this.#target)
          ? Vector2.splat(1 / this.#target.zoom)
          : this.#target.globalTransform.scale.clone();

        this.#action = { type: "scale", axis, offset, original };
        this.fire(GizmoScaleStart, this.#target, axis);
      };

    scaleX.on(MouseDown, scaleOnMouseDown("x"));
    scaleY.on(MouseDown, scaleOnMouseDown("y"));
  }
  // #endregion

  // #region Action / Signals
  #action:
    | { type: "translate"; axis: "x" | "y" | "both"; offset: Vector2; original: Vector2 }
    | { type: "rotate"; offset: number; original: number }
    | { type: "scale"; axis: "x" | "y" | "both"; offset: Vector2; original: Vector2 }
    | undefined;

  // Snap lock fields:
  #snappedXLine: number | null = null;
  #snappedYLine: number | null = null;

  #clearSnapLines() {
    this.#snappedXLine = null;
    this.#snappedYLine = null;
  }

  // Helper to get global bounding lines for an entity
  static getGlobalBoundingLines(
    entity: Entity,
  ): {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
  } | null {
    const size = entity.bounds;
    if (!size) return null;

    const pos = entity.globalTransform.position;
    const scale = entity.globalTransform.scale;
    const rotation = entity.globalTransform.rotation;

    const halfW = size.x / 2;
    const halfH = size.y / 2;

    const corners = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH },
    ];

    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    for (const c of corners) {
      // scale
      c.x *= scale.x;
      c.y *= scale.y;
      // rotate
      const rx = c.x * cosR - c.y * sinR;
      const ry = c.x * sinR + c.y * cosR;
      c.x = rx;
      c.y = ry;
      // translate
      c.x += pos.x;
      c.y += pos.y;
    }

    const xs = corners.map(c => c.x);
    const ys = corners.map(c => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { left: minX, right: maxX, top: maxY, bottom: minY, centerX, centerY };
  }

  #getSnapCandidates(entities: Entity[]): { xLines: number[]; yLines: number[] } {
    const xLines: number[] = [];
    const yLines: number[] = [];

    if (!this.#target) return { xLines, yLines };

    const targetLines = Gizmo.getGlobalBoundingLines(this.#target);
    if (!targetLines) return { xLines, yLines };

    for (const e of entities) {
      if (e === this.#target) continue;
      const lines = Gizmo.getGlobalBoundingLines(e);
      if (!lines) continue;

      const dx = lines.centerX - targetLines.centerX;
      const dy = lines.centerY - targetLines.centerY;
      const distSquared = dx * dx + dy * dy;
      if (distSquared < Gizmo.POSITION_TOLERANCE * Gizmo.POSITION_TOLERANCE) {
        continue;
      }

      xLines.push(lines.left, lines.centerX, lines.right);
      yLines.push(lines.bottom, lines.centerY, lines.top);
    }

    return { xLines, yLines };
  }

  #trySnapPosition(
    pos: Vector2,
    entities: Entity[],
    axis: "x" | "y" | "both",
    shiftKey: boolean,
  ): Vector2 {
    if (!shiftKey) {
      // If shift is not held, no snapping
      this.#clearSnapLines();
      return pos;
    }

    // If we already snapped to a line, check dead zone
    if ((axis === "x" || axis === "both") && this.#snappedXLine !== null) {
      if (Math.abs(this.#snappedXLine - pos.x) < Gizmo.DEAD_ZONE) {
        pos.x = this.#snappedXLine;
      } else {
        this.#snappedXLine = null;
      }
    }

    if ((axis === "y" || axis === "both") && this.#snappedYLine !== null) {
      if (Math.abs(this.#snappedYLine - pos.y) < Gizmo.DEAD_ZONE) {
        pos.y = this.#snappedYLine;
      } else {
        this.#snappedYLine = null;
      }
    }

    // If we are still snapped on both axes or no need to find new snaps, return early
    if (
      (axis === "x" || axis === "both") &&
      this.#snappedXLine !== null &&
      (axis === "y" || axis === "both") &&
      this.#snappedYLine !== null
    ) {
      return pos;
    }
    if (axis === "x" && this.#snappedXLine !== null && axis !== "y") return pos;
    if (axis === "y" && this.#snappedYLine !== null && axis !== "x") return pos;

    const { xLines, yLines } = this.#getSnapCandidates(entities);
    const targetLines = Gizmo.getGlobalBoundingLines(this.#target!);
    if (!targetLines) return pos;

    const halfW = (targetLines.right - targetLines.left) / 2;
    const halfH = (targetLines.top - targetLines.bottom) / 2;

    const left = pos.x - halfW;
    const right = pos.x + halfW;
    const centerX = pos.x;

    const bottom = pos.y - halfH;
    const top = pos.y + halfH;
    const centerY = pos.y;

    let bestXDist = Infinity;
    let bestXValue = pos.x;
    if (axis === "x" || axis === "both") {
      for (const tLine of [left, centerX, right]) {
        for (const xLine of xLines) {
          const dist = Math.abs(xLine - tLine);
          if (dist < Gizmo.SNAP_THRESHOLD && dist < bestXDist) {
            bestXDist = dist;
            const offset = tLine - pos.x;
            bestXValue = xLine - offset;
          }
        }
      }
    }

    let bestYDist = Infinity;
    let bestYValue = pos.y;
    if (axis === "y" || axis === "both") {
      for (const tLine of [bottom, centerY, top]) {
        for (const yLine of yLines) {
          const dist = Math.abs(yLine - tLine);
          if (dist < Gizmo.SNAP_THRESHOLD && dist < bestYDist) {
            bestYDist = dist;
            const offset = tLine - pos.y;
            bestYValue = yLine - offset;
          }
        }
      }
    }

    // Apply the best snap found
    if (bestXDist < Infinity && (axis === "x" || axis === "both")) {
      pos.x = bestXValue;
      this.#snappedXLine = pos.x;
    }
    if (bestYDist < Infinity && (axis === "y" || axis === "both")) {
      pos.y = bestYValue;
      this.#snappedYLine = pos.y;
    }

    return pos;
  }

  #onMouseMove = (event: PointerEvent) => {
    if (!this.#target || !this.#action) return;

    const cursor = this.inputs.cursor;
    if (!cursor.world) return;

    if (this.#action.type === "translate") {
      let pos = cursor.world.sub(this.#action.offset);

      // Convert to local space and constrain axis
      const local = pointWorldToLocal(this.globalTransform, pos);
      if (this.#action.axis === "x") local.y = 0;
      if (this.#action.axis === "y") local.x = 0;
      pos = pointLocalToWorld(this.globalTransform, local);

      pos = this.#trySnapPosition(
        pos,
        Array.from(this.game.entities),
        this.#action.axis,
        event.shiftKey,
      );

      this.fire(GizmoTranslateMove, this.#target, pos.clone());
      this.#target.globalTransform.position = pos;
    } else if (this.#action.type === "rotate") {
      const pos = cursor.world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);

      const rotation = -rot + this.#action.offset;
      // For rotation, you could also implement snapping to certain angles if needed
      this.fire(GizmoRotateMove, this.#target, rotation);
      this.#target.globalTransform.rotation = rotation;
    } else if (this.#action.type === "scale") {
      const originalDistance = this.#action.offset.magnitude();
      const offset = cursor.world.sub(this.globalTransform.position);
      const offsetDistance = offset.magnitude();

      const mul = Vector2.splat(offsetDistance / originalDistance);
      if (this.#action.axis === "x") mul.y = 1;
      if (this.#action.axis === "y") mul.x = 1;
      const scale = this.#action.original.mul(mul);

      this.fire(GizmoScaleMove, this.#target, scale.clone());
      if (isCamera(this.#target)) {
        this.#target.zoom = 1 / (this.#action.axis === "y" ? scale.y : scale.x);
      } else {
        this.#target.globalTransform.scale = scale;
      }
    }
  };

  #onMouseUp = (_: PointerEvent) => {
    if (!this.#action) return;
    if (!this.#target) {
      console.warn("mouse released without target, events will not fire");
      this.#action = undefined;
      return;
    }

    if (this.#action.type === "translate") {
      this.fire(
        GizmoTranslateEnd,
        this.#target,
        this.#action.original.clone(),
        this.#target.pos.clone(),
      );
      this.game.fire(
        GizmoTranslateEnd,
        this.#target,
        this.#action.original.clone(),
        this.#target.pos.clone(),
      );
    } else if (this.#action.type === "rotate") {
      this.fire(
        GizmoRotateEnd,
        this.#target,
        this.#action.original,
        this.#target.globalTransform.rotation,
      );
      this.game.fire(
        GizmoRotateEnd,
        this.#target,
        this.#action.original,
        this.#target.globalTransform.rotation,
      );
    } else if (this.#action.type === "scale") {
      this.fire(
        GizmoScaleEnd,
        this.#target,
        this.#action.original.clone(),
        isCamera(this.#target)
          ? Vector2.splat(1 / this.#target.zoom)
          : this.#target.globalTransform.scale.clone(),
      );
      this.game.fire(
        GizmoScaleEnd,
        this.#target,
        this.#action.original.clone(),
        isCamera(this.#target)
          ? Vector2.splat(1 / this.#target.zoom)
          : this.#target.globalTransform.scale.clone(),
      );
    }

    this.#action = undefined;
    this.#clearSnapLines();
  };
  // #endregion

  #target: Entity | undefined;
  get target(): Entity | undefined {
    return this.#target;
  }
  set target(value: Entity | undefined) {
    this.#target = value;
    if (this.#gfx) this.#gfx.context = this.#ctx;
    this.#updateHandles();
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    // Must be a local entity on the client
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error(`${this.constructor.name} must be spawned as a local client entity`);
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#gfx) return;

      if (this.#target) {
        this.globalTransform.position = this.#target.globalTransform.position;
        this.globalTransform.rotation = this.#target.globalTransform.rotation;
      }

      const pos = this.globalTransform.position;
      const rotation = this.globalTransform.rotation;

      this.#gfx.position = { x: pos.x, y: -pos.y };
      this.#gfx.rotation = -rotation;

      const camera = Camera.getActive(this.game);
      if (camera) {
        this.#gfx.scale = camera.smoothed.scale;
        this.globalTransform.scale = camera.smoothed.scale;
      } else {
        this.#gfx.scale = 1;
      }
    });

    this.on(EntityDestroyed, () => {
      this.#gfx?.destroy();

      if (this.game.isClient()) {
        const canvas = this.game.renderer.app.canvas;
        canvas.removeEventListener("pointermove", this.#onMouseMove);
        canvas.removeEventListener("pointerup", this.#onMouseUp);
      }
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    this.#gfx = new PIXI.Graphics(this.#ctx);
    this.#gfx.zIndex = 9999999999;
    this.game.renderer.scene.addChild(this.#gfx);

    this.#updateHandles();

    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("pointermove", this.#onMouseMove);
    canvas.addEventListener("pointerup", this.#onMouseUp);
  }
}
