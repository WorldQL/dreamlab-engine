import type { EntityContext } from "@dreamlab/engine";
import {
  Camera,
  Clickable,
  Entity,
  EntityDestroyed,
  GameRender,
  MouseDown,
  pointLocalToWorld,
  pointWorldToLocal,
  Vector2,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

// #region Signals
// #region Translate
export class GizmoTranslateStart {
  constructor(
    public readonly entity: Entity,
    public readonly axis: "x" | "y" | "both",
  ) {}
}

export class GizmoTranslateMove {
  constructor(
    public readonly entity: Entity,
    public readonly position: Vector2,
  ) {}
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
  constructor(
    public readonly entity: Entity,
    public readonly rotation: number,
  ) {}
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
  constructor(
    public readonly entity: Entity,
    public readonly axis: "x" | "y" | "both",
  ) {}
}

export class GizmoScaleMove {
  constructor(
    public readonly entity: Entity,
    public readonly scale: Vector2,
  ) {}
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

  static readonly icon = "➡️";
  static readonly SNAP_THRESHOLD = 0.3;
  static readonly POSITION_TOLERANCE = 0.001;
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

  #snapLinesGfx: PIXI.Graphics | undefined;

  get #ctx() {
    if (!this.#target) return Gizmo.#blankCtx;
    else if (this.mode === "combined") return Gizmo.#combinedCtx;
    else throw new Error("invalid mode");
  }
  // #endregion

  // #region Mode
  #mode: "combined" = "combined";
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
    // Destroy existing chilldren
    this.children.forEach(c => c.destroy());

    // Don't spawn handles if no target entity
    if (!this.#target) return;
    else if (this.mode === "combined") this.#combinedHandles();
    else throw new Error("invalid mode");
  }

  #combinedHandles() {
    const translateHandleSize = Math.max(Gizmo.#ARROW_W, Gizmo.#ARROW_H);
    const translateClickSize = translateHandleSize * 1.333;

    const translateX = this.spawn({
      type: Clickable,
      name: "TranslateX",
      transform: { position: { x: 1.1 + translateHandleSize / 2, y: 0 } },
      values: { shape: "Rectangle", width: translateClickSize, height: translateClickSize },
    });

    const translateY = this.spawn({
      type: Clickable,
      name: "TranslateY",
      transform: { position: { x: 0, y: 1.1 + translateHandleSize / 2 } },
      values: { shape: "Rectangle", width: translateClickSize, height: translateClickSize },
    });

    const translateBoth = this.spawn({
      type: Clickable,
      name: "TranslateBoth",
      transform: { position: { x: 0, y: 0 } },
      values: { shape: "Rectangle", width: 0.3, height: 0.3 },
    });

    const rotate = this.spawn({
      type: Clickable,
      name: "Rotate",
      values: { shape: "Circle", radius: 1.05, innerRadius: 0.95 },
    });

    const scaleHandleSize = Gizmo.#SCALE_S;
    const scaleClickSize = scaleHandleSize * 1.333;

    const scaleX = this.spawn({
      type: Clickable,
      name: "ScaleX",
      transform: { position: { x: 0.7 + scaleHandleSize / 2, y: 0 } },
      values: { shape: "Rectangle", width: scaleClickSize, height: scaleClickSize },
    });

    const scaleY = this.spawn({
      type: Clickable,
      name: "ScaleY",
      transform: { position: { x: 0, y: 0.7 + scaleHandleSize / 2 } },
      values: { shape: "Rectangle", width: scaleClickSize, height: scaleClickSize },
    });

    const translateOnMouseDown =
      (axis: "x" | "y" | "both") =>
      ({ button, cursor: { world } }: MouseDown) => {
        if (!this.#target) return;
        if (button !== "left") return;

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

  #onMouseMove = (event: PointerEvent) => {
    this.#snapLinesGfx!.clear();
    if (!this.#target) return;
    if (!this.#action) return;

    const cursor = this.inputs.cursor;
    if (!cursor.world) return;

    if (this.#action.type === "translate") {
      const pos = cursor.world.sub(this.#action.offset);

      const local = pointWorldToLocal(this.globalTransform, pos);
      if (this.#action.axis === "x") local.y = 0;
      if (this.#action.axis === "y") local.x = 0;
      const world = pointLocalToWorld(this.globalTransform, local);

      if (event.shiftKey) {
        const snapThreshold = 0.1;

        // Save original position
        const originalPos = this.#target.globalTransform.position.clone();

        // Temporarily move target to the tentative position
        this.#target.globalTransform.position = world;
        const targetBounds = this.#computeGlobalBounds(this.#target);

        const targetCenterX = (targetBounds.minX + targetBounds.maxX) / 2;
        const targetCenterY = (targetBounds.minY + targetBounds.maxY) / 2;

        // Restore after bounds computation, since we only needed it for calculation
        this.#target.globalTransform.position = originalPos;

        const allEntities = Array.from(this.game.entities);
        let snapX: number | undefined;
        let snapY: number | undefined;

        for (const e of allEntities) {
          if (e === this.#target) continue;
          if (e.parent === this.#target) continue;
          if (!(e instanceof Entity)) continue;
          if (e.id === "game.local._.Gizmo" || e.parent?.id === "game.local._.Gizmo") continue;
          if (e.id.includes("__EditorMetadata")) continue;
          if (!e.parent) continue;
          // constructor.name checks because imports sometimes cause circular import issues
          if (e.constructor.name === "Camera" || e.constructor.name === "EditorFacadeCamera")
            continue;
          if (e.id === "game.world._.EditEntities") continue;
          if (e.constructor.name === "WorldRootFacade") continue;
          if (e.constructor.name === "ServerRootFacade") continue;
          if (e.constructor.name === "LocalRootFacade") continue;
          if (e.constructor.name === "PrefabRootFacade") continue;

          // const distanceFromTarget = this.#target.pos.distance(e.pos);
          // console.log(distanceFromTarget, e.id, e.parent?.id);

          const entityBounds = this.#computeGlobalBounds(e);

          const entityCenterX = (entityBounds.minX + entityBounds.maxX) / 2;
          const entityCenterY = (entityBounds.minY + entityBounds.maxY) / 2;

          if (this.#action.axis === "x" || this.#action.axis === "both") {
            // Align target's left edge to entity's right edge
            const dxLeft = entityBounds.maxX - targetBounds.minX;
            if (Math.abs(dxLeft) < snapThreshold) {
              snapX = snapX === undefined ? world.x + dxLeft : snapX;

              // Compute a vertical line that covers both entity and target vertically
              const combinedMinY = Math.min(entityBounds.minY, targetBounds.minY);
              const combinedMaxY = Math.max(entityBounds.maxY, targetBounds.maxY);

              this.#snapLinesGfx!.context.moveTo(entityBounds.maxX, -combinedMinY)
                .lineTo(entityBounds.maxX, -combinedMaxY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }

            // Align target's right edge to entity's left edge
            const dxRight = entityBounds.minX - targetBounds.maxX;
            if (Math.abs(dxRight) < snapThreshold) {
              snapX = snapX === undefined ? world.x + dxRight : snapX;

              const combinedMinY = Math.min(entityBounds.minY, targetBounds.minY);
              const combinedMaxY = Math.max(entityBounds.maxY, targetBounds.maxY);

              this.#snapLinesGfx!.context.moveTo(entityBounds.minX, -combinedMinY)
                .lineTo(entityBounds.minX, -combinedMaxY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }

            // Align target's left edge to entity's left edge
            const dxLeftToLeft = entityBounds.minX - targetBounds.minX;
            if (Math.abs(dxLeftToLeft) < snapThreshold) {
              snapX = snapX === undefined ? world.x + dxLeftToLeft : snapX;

              const combinedMinY = Math.min(entityBounds.minY, targetBounds.minY);
              const combinedMaxY = Math.max(entityBounds.maxY, targetBounds.maxY);

              this.#snapLinesGfx!.context.moveTo(entityBounds.minX, -combinedMinY)
                .lineTo(entityBounds.minX, -combinedMaxY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }

            // Align target's right edge to entity's right edge
            const dxRightToRight = entityBounds.maxX - targetBounds.maxX;
            if (Math.abs(dxRightToRight) < snapThreshold) {
              snapX = snapX === undefined ? world.x + dxRightToRight : snapX;

              const combinedMinY = Math.min(entityBounds.minY, targetBounds.minY);
              const combinedMaxY = Math.max(entityBounds.maxY, targetBounds.maxY);

              this.#snapLinesGfx!.context.moveTo(entityBounds.maxX, -combinedMinY)
                .lineTo(entityBounds.maxX, -combinedMaxY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }

            // Center alignment horizontally
            const dxCenter = entityCenterX - targetCenterX;
            if (Math.abs(dxCenter) < snapThreshold) {
              snapX = snapX === undefined ? world.x + dxCenter : snapX;

              const combinedMinY = Math.min(entityBounds.minY, targetBounds.minY);
              const combinedMaxY = Math.max(entityBounds.maxY, targetBounds.maxY);

              this.#snapLinesGfx!.context.moveTo(entityCenterX, -combinedMinY)
                .lineTo(entityCenterX, -combinedMaxY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }
          }

          if (this.#action.axis === "y" || this.#action.axis === "both") {
            // Align target's top edge to entity's top edge
            const dyTop = entityBounds.minY - targetBounds.minY;
            if (Math.abs(dyTop) < snapThreshold) {
              snapY = snapY === undefined ? world.y + dyTop : snapY;

              const combinedMinX = Math.min(entityBounds.minX, targetBounds.minX);
              const combinedMaxX = Math.max(entityBounds.maxX, targetBounds.maxX);

              this.#snapLinesGfx!.context.moveTo(combinedMinX, -entityBounds.minY)
                .lineTo(combinedMaxX, -entityBounds.minY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }

            // Align target's bottom edge to entity's bottom edge
            const dyBottom = entityBounds.maxY - targetBounds.maxY;
            if (Math.abs(dyBottom) < snapThreshold) {
              snapY = snapY === undefined ? world.y + dyBottom : snapY;

              const combinedMinX = Math.min(entityBounds.minX, targetBounds.minX);
              const combinedMaxX = Math.max(entityBounds.maxX, targetBounds.maxX);

              this.#snapLinesGfx!.context.moveTo(combinedMinX, -entityBounds.maxY)
                .lineTo(combinedMaxX, -entityBounds.maxY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }

            // Align target's top edge to entity's bottom edge (no vertical gap)
            const dyTopTouch = entityBounds.maxY - targetBounds.minY;
            if (Math.abs(dyTopTouch) < snapThreshold) {
              snapY = snapY === undefined ? world.y + dyTopTouch : snapY;

              const combinedMinX = Math.min(entityBounds.minX, targetBounds.minX);
              const combinedMaxX = Math.max(entityBounds.maxX, targetBounds.maxX);

              this.#snapLinesGfx!.context.moveTo(combinedMinX, -entityBounds.maxY)
                .lineTo(combinedMaxX, -entityBounds.maxY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }

            // Align target's bottom edge to entity's top edge (no vertical gap)
            const dyBottomTouch = entityBounds.minY - targetBounds.maxY;
            if (Math.abs(dyBottomTouch) < snapThreshold) {
              snapY = snapY === undefined ? world.y + dyBottomTouch : snapY;

              const combinedMinX = Math.min(entityBounds.minX, targetBounds.minX);
              const combinedMaxX = Math.max(entityBounds.maxX, targetBounds.maxX);

              this.#snapLinesGfx!.context.moveTo(combinedMinX, -entityBounds.minY)
                .lineTo(combinedMaxX, -entityBounds.minY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }

            // Center alignment vertically
            const dyCenter = entityCenterY - targetCenterY;
            if (Math.abs(dyCenter) < snapThreshold) {
              snapY = snapY === undefined ? world.y + dyCenter : snapY;

              const combinedMinX = Math.min(entityBounds.minX, targetBounds.minX);
              const combinedMaxX = Math.max(entityBounds.maxX, targetBounds.maxX);

              this.#snapLinesGfx!.context.moveTo(combinedMinX, -entityCenterY)
                .lineTo(combinedMaxX, -entityCenterY)
                .stroke({ color: 0xabddff, width: 0.03 });
            }
          }
        }

        // Apply any snap adjustments
        if (snapX !== undefined) world.x = snapX;
        if (snapY !== undefined) world.y = snapY;
      }

      this.fire(GizmoTranslateMove, this.#target, world.clone());
      this.#target.globalTransform.position = world;
    } else if (this.#action.type === "rotate") {
      const pos = cursor.world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);

      const rotation = -rot + this.#action.offset;
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
        this.#target.globalTransform.scale.clone(),
      );
      this.game.fire(
        GizmoScaleEnd,
        this.#target,
        this.#action.original.clone(),
        this.#target.globalTransform.scale.clone(),
      );
    }

    this.#action = undefined;
  };
  // #endregion

  #target: Entity | undefined;
  get target(): Entity | undefined {
    return this.#target;
  }
  set target(value: Entity | undefined) {
    if (this.#target) this.#target.unregister(EntityDestroyed, this.#onTargetDestroyed);

    this.#target = value;
    if (this.#gfx) this.#gfx.context = this.#ctx;
    this.#updateHandles();
    if (this.#target) this.#target.on(EntityDestroyed, this.#onTargetDestroyed);
  }

  #onTargetDestroyed = () => {
    this.target = undefined;
  };

  constructor(ctx: EntityContext) {
    super(ctx);

    // Must be a local entity
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

    this.#snapLinesGfx = new PIXI.Graphics();
    this.#snapLinesGfx.zIndex = 9999999999;
    this.game.renderer.scene.addChild(this.#snapLinesGfx);

    this.#updateHandles();

    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("pointermove", this.#onMouseMove);
    canvas.addEventListener("pointerup", this.#onMouseUp);
  }

  #computeGlobalBounds(entity: Entity) {
    // Assume entity.bounds returns {x:1,y:1}
    // Compute half-size
    const half = {
      x: 0.5 * entity.globalTransform.scale.x,
      y: 0.5 * entity.globalTransform.scale.y,
    };

    // For a centered 1x1 box, corners in local space:
    // top-right:    ( half.x,  half.y)
    // top-left:     (-half.x,  half.y)
    // bottom-left:  (-half.x, -half.y)
    // bottom-right: ( half.x, -half.y)
    const corners = [
      new Vector2(half.x, half.y),
      new Vector2(-half.x, half.y),
      new Vector2(-half.x, -half.y),
      new Vector2(half.x, -half.y),
    ];

    const pos = entity.globalTransform.position;
    const rot = entity.globalTransform.rotation;
    const sin = Math.sin(rot);
    const cos = Math.cos(rot);

    // Rotate & translate each corner
    for (const c of corners) {
      const x = c.x * cos - c.y * sin;
      const y = c.x * sin + c.y * cos;
      c.x = x + pos.x;
      c.y = y + pos.y;
    }

    // Determine min and max edges
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    for (const c of corners) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }

    return { minX, maxX, minY, maxY };
  }
}
