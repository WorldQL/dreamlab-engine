import type { EntityContext, Transform } from "@dreamlab/engine";
import {
  Camera,
  Clickable,
  Entity,
  EntityDestroyed,
  GameRender,
  MouseDown,
  pointLocalToWorld,
  pointWorldToLocal,
  Root,
  Vector2,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EmptyFacade } from "../facades/empty.ts";
import { EditorFacadeTilemap } from "../facades/tilemap.ts";
import { EditorMetadataEntity } from "../metadata.ts";
import { EditorFacadeCamera, EditorRootFacadeEntity } from "../mod.ts";
import { BoxResizeGizmo } from "./box-resize.ts";

// #region Signals
export class GizmoUpdateStart {
  constructor(
    public readonly operation: "translate" | "rotate" | "scale",
    public readonly entities: {
      readonly entity: Entity;
      readonly transform: Transform;
    }[],
  ) {}
}

export class GizmoUpdateMove {
  constructor(
    public readonly operation: "translate" | "rotate" | "scale",
    public readonly entities: {
      readonly entity: Entity;
      readonly transform: Transform;
    }[],
  ) {}
}

export class GizmoUpdateEnd {
  constructor(
    public readonly operation: "translate" | "rotate" | "scale",
    public readonly entities: {
      readonly entity: Entity;
      readonly transform: Transform;
      readonly previous: Transform;
    }[],
  ) {}
}
// #endregion

export class Gizmo extends Entity {
  static {
    Entity.registerType(this, "@editor");
  }

  static readonly icon = "➡️";
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
    .stroke({ color: "black", width: 0.01 }) // red square
    .rect(-Gizmo.#SCALE_S / 2, -0.7 - Gizmo.#SCALE_S, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#Y_COLOR)
    .stroke({ color: "black", width: 0.01 }) // green square
    // Move handles
    .poly([1.1, Gizmo.#ARROW_W / 2, 1.1, -Gizmo.#ARROW_W / 2, 1.1 + Gizmo.#ARROW_H, 0])
    .fill(Gizmo.#X_COLOR)
    .stroke({ color: "black", width: 0.01 }) // red arrow
    .poly([Gizmo.#ARROW_W / 2, -1.1, -Gizmo.#ARROW_W / 2, -1.1, 0, -1.1 - Gizmo.#ARROW_H])
    .fill(Gizmo.#Y_COLOR)
    .stroke({ color: "black", width: 0.01 }) // green arrow
    // Center square
    .moveTo(0, 0)
    .rect(-0.25, -0.25, 0.5, 0.5)
    .fill({ alpha: 0.4, color: Gizmo.#Z_COLOR })
    .stroke({ alpha: 0.8, color: Gizmo.#Z_COLOR, width: 0.02 })
    .stroke({ color: "white", width: 0.01 })
    // Rotation circle
    .scale(0.1)
    .circle(0, 0, 10)
    .stroke({ color: Gizmo.#NEUTRAL_COLOR, width: 0.02 });

  #gfx: PIXI.Graphics | undefined;

  #snapLinesGfx: PIXI.Graphics | undefined;

  #lastPaintingState = false;

  get #ctx() {
    if (!this.#target) return Gizmo.#blankCtx;
    if (this.#target[0] instanceof EditorFacadeTilemap && this.#target[0].shouldPaint()) {
      return Gizmo.#blankCtx;
    }
    if (this.mode === "combined") return Gizmo.#combinedCtx;
    throw new Error("invalid mode");
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
    const isPainting =
      this.#target?.[0] instanceof EditorFacadeTilemap && this.#target[0].shouldPaint();

    if (isPainting) {
      this.children.forEach(c => (c.enabled = false));
      return;
    } else {
      this.children.forEach(c => (c.enabled = true));
    }

    if (!this.#target) {
      this.children.forEach(c => c.destroy());
      return;
    }

    if (this.children.size === 0 && this.mode === "combined") {
      this.#combinedHandles();
    } else if (this.mode !== "combined") {
      throw new Error("invalid mode");
    }
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
      values: { shape: "Rectangle", width: 0.5, height: 0.5 },
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

        const entityArray = [this.#target[0], ...this.#auxTargets.keys()];
        const entities = entityArray.map(entity => ({
          entity,
          transform: entity.globalTransform.clone(),
        }));

        const originals = new Map(
          entityArray.map(entity => [entity, entity.globalTransform.clone()] as const),
        );

        this.#action = { type: "translate", axis, offset, originals };
        this.fire(GizmoUpdateStart, "translate", entities);
      };

    translateX.on(MouseDown, translateOnMouseDown("x"));
    translateY.on(MouseDown, translateOnMouseDown("y"));
    translateBoth.on(MouseDown, translateOnMouseDown("both"));

    rotate.on(MouseDown, ({ button, cursor: { world } }) => {
      if (!this.#target) return;
      if (button !== "left") return;

      const pos = world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);

      const entityArray = [this.#target[0], ...this.#auxTargets.keys()];
      const entities = entityArray.map(entity => ({
        entity,
        transform: entity.globalTransform.clone(),
      }));

      const originals = new Map(
        entityArray.map(entity => [entity, entity.globalTransform.clone()] as const),
      );

      this.#action = {
        type: "rotate",
        offset: rot + this.globalTransform.rotation,
        originals,
        origin: this.#calculateAvgPosition(),
      };
      this.fire(GizmoUpdateStart, "rotate", entities);
    });

    const scaleOnMouseDown =
      (axis: "x" | "y" | "both") =>
      ({ button, cursor: { world } }: MouseDown) => {
        if (!this.#target) return;
        if (button !== "left") return;

        const offset = world.sub(this.globalTransform.position);

        // TODO: uhhhh why is this referencing zoom
        // const original = (this.#target[0] instanceof Camera || this.#target[0] instanceof EditorFacadeCamera)
        //   ? Vector2.splat(1 / this.#target[0].zoom)
        //   : this.#target[0].globalTransform.scale.clone();

        const entityArray = [this.#target[0], ...this.#auxTargets.keys()];
        const entities = entityArray.map(entity => ({
          entity,
          transform: entity.globalTransform.clone(),
        }));

        const originals = new Map(
          entityArray.map(entity => {
            const transform = entity.globalTransform.clone();
            if (entity instanceof Camera || entity instanceof EditorFacadeCamera) {
              transform.scale = Vector2.splat(1 / entity.zoom);
            }

            return [entity, transform] as const;
          }),
        );

        this.#action = {
          type: "scale",
          axis,
          offset,
          originals,
          origin: this.#calculateAvgPosition(),
        };
        this.fire(GizmoUpdateStart, "scale", entities);
      };

    scaleX.on(MouseDown, scaleOnMouseDown("x"));
    scaleY.on(MouseDown, scaleOnMouseDown("y"));
  }
  // #endregion

  // #region Action / Signals
  #action:
    | {
        type: "translate";
        axis: "x" | "y" | "both";
        offset: Vector2;
        originals: Map<Entity, Transform>;
      }
    | { type: "rotate"; offset: number; originals: Map<Entity, Transform>; origin: Vector2 }
    | {
        type: "scale";
        axis: "x" | "y" | "both";
        offset: Vector2;
        originals: Map<Entity, Transform>;
        origin: Vector2;
      }
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

        const allSelectedEntities = [this.#target[0], ...this.#auxTargets.keys()];

        const originalPositions = new Map(
          allSelectedEntities.map(entity => [entity, entity.globalTransform.position.clone()]),
        );

        // Temporarily move all entities to tentative position
        this.#target[0].globalTransform.position = world.add(this.#target[1]);
        for (const [entity, offset] of this.#auxTargets) {
          entity.globalTransform.position = world.add(offset);
        }

        let targetCorners = Gizmo.getTransformedCorners(this.#target[0]);
        let targetBounds = Gizmo.computeGlobalBounds(this.#target[0]);

        if (allSelectedEntities.length > 1) {
          // aabb if we have multiselect
          targetBounds = Gizmo.computeAABBForEntities(allSelectedEntities);
          targetCorners = Gizmo.getAABBCorners(targetBounds);
        }

        const targetCenter = {
          x: (targetBounds.minX + targetBounds.maxX) / 2,
          y: (targetBounds.minY + targetBounds.maxY) / 2,
        };

        for (const [entity, originalPos] of originalPositions) {
          entity.globalTransform.position = originalPos;
        }

        let snapX: number | undefined;
        let snapY: number | undefined;
        let bestSnapDistanceX = snapThreshold;
        let bestSnapDistanceY = snapThreshold;
        let bestXSnapInfo:
          | { line: number; minY: number; maxY: number; color: number }
          | undefined;
        let bestYSnapInfo:
          | { line: number; minX: number; maxX: number; color: number }
          | undefined;

        for (const e of this.game.entities) {
          if (allSelectedEntities.includes(e)) continue;
          if (allSelectedEntities.some(selected => e.parent === selected)) continue;
          if (!e.enabled) continue;
          if (e instanceof Root) continue;
          if (e instanceof Gizmo || e.parent instanceof Gizmo) continue;
          if (
            e instanceof BoxResizeGizmo ||
            e.parent instanceof BoxResizeGizmo ||
            e.parent?.parent instanceof BoxResizeGizmo
          )
            continue;
          if (e instanceof Camera || e instanceof EditorFacadeCamera) continue;
          if (e instanceof EditorRootFacadeEntity) continue;
          if (e instanceof EditorMetadataEntity) continue;
          if (e instanceof EmptyFacade) continue;
          if (e.ref === "EDIT_ROOT") continue;

          const entityBounds = Gizmo.computeGlobalBounds(e);
          const entityCorners = Gizmo.getTransformedCorners(e);
          const entityCenter = {
            x: (entityBounds.minX + entityBounds.maxX) / 2,
            y: (entityBounds.minY + entityBounds.maxY) / 2,
          };

          // Corner-to-corner snapping (like Figma)
          for (const targetCorner of targetCorners) {
            for (const entityCorner of entityCorners) {
              const dx = entityCorner.x - targetCorner.x;
              const dy = entityCorner.y - targetCorner.y;

              // Check X alignment
              if (Math.abs(dx) < bestSnapDistanceX && dx !== 0) {
                snapX = world.x + dx;
                bestSnapDistanceX = Math.abs(dx);

                const minY = Math.min(
                  targetBounds.minY,
                  targetBounds.maxY,
                  entityBounds.minY,
                  entityBounds.maxY,
                );
                const maxY = Math.max(
                  targetBounds.minY,
                  targetBounds.maxY,
                  entityBounds.minY,
                  entityBounds.maxY,
                );

                bestXSnapInfo = { line: entityCorner.x, minY, maxY, color: 0xff6b9d };
              }

              // Check Y alignment
              if (Math.abs(dy) < bestSnapDistanceY && dy !== 0) {
                snapY = world.y + dy;
                bestSnapDistanceY = Math.abs(dy);

                const minX = Math.min(
                  targetBounds.minX,
                  targetBounds.maxX,
                  entityBounds.minX,
                  entityBounds.maxX,
                );
                const maxX = Math.max(
                  targetBounds.minX,
                  targetBounds.maxX,
                  entityBounds.minX,
                  entityBounds.maxX,
                );

                bestYSnapInfo = { line: entityCorner.y, minX, maxX, color: 0xff6b9d };
              }
            }
          }

          // Corner-to-center snapping
          for (const targetCorner of targetCorners) {
            const dx = entityCenter.x - targetCorner.x;
            const dy = entityCenter.y - targetCorner.y;

            // Check X alignment
            if (Math.abs(dx) < bestSnapDistanceX && dx !== 0) {
              snapX = world.x + dx;
              bestSnapDistanceX = Math.abs(dx);

              const minY = Math.min(entityBounds.minY, targetBounds.minY);
              const maxY = Math.max(entityBounds.maxY, targetBounds.maxY);

              bestXSnapInfo = { line: entityCenter.x, minY, maxY, color: 0xffb366 };
            }

            // Check Y alignment
            if (Math.abs(dy) < bestSnapDistanceY && dy !== 0) {
              snapY = world.y + dy;
              bestSnapDistanceY = Math.abs(dy);

              const minX = Math.min(entityBounds.minX, targetBounds.minX);
              const maxX = Math.max(entityBounds.maxX, targetBounds.maxX);

              bestYSnapInfo = { line: entityCenter.y, minX, maxX, color: 0xffb366 };
            }
          }

          // Center-to-corner snapping
          for (const entityCorner of entityCorners) {
            const dx = entityCorner.x - targetCenter.x;
            const dy = entityCorner.y - targetCenter.y;

            // Check X alignment
            if (Math.abs(dx) < bestSnapDistanceX && dx !== 0) {
              snapX = world.x + dx;
              bestSnapDistanceX = Math.abs(dx);

              const minY = Math.min(entityBounds.minY, targetBounds.minY);
              const maxY = Math.max(entityBounds.maxY, targetBounds.maxY);

              bestXSnapInfo = { line: entityCorner.x, minY, maxY, color: 0x66d9ff };
            }

            // Check Y alignment
            if (Math.abs(dy) < bestSnapDistanceY && dy !== 0) {
              snapY = world.y + dy;
              bestSnapDistanceY = Math.abs(dy);

              const minX = Math.min(entityBounds.minX, targetBounds.minX);
              const maxX = Math.max(entityBounds.maxX, targetBounds.maxX);

              bestYSnapInfo = { line: entityCorner.y, minX, maxX, color: 0x66d9ff };
            }
          }

          // Edge-to-edge snapping (existing behavior, but cleaner)
          const edgeAlignments = [
            // Horizontal alignments
            { delta: entityBounds.minX - targetBounds.minX, line: entityBounds.minX }, // left-to-left
            { delta: entityBounds.maxX - targetBounds.maxX, line: entityBounds.maxX }, // right-to-right
            { delta: entityBounds.minX - targetBounds.maxX, line: entityBounds.minX }, // right-to-left
            { delta: entityBounds.maxX - targetBounds.minX, line: entityBounds.maxX }, // left-to-right
          ];

          for (const alignment of edgeAlignments) {
            if (Math.abs(alignment.delta) < bestSnapDistanceX && alignment.delta !== 0) {
              snapX = world.x + alignment.delta;
              bestSnapDistanceX = Math.abs(alignment.delta);

              const minY = Math.min(entityBounds.minY, targetBounds.minY);
              const maxY = Math.max(entityBounds.maxY, targetBounds.maxY);

              bestXSnapInfo = { line: alignment.line, minY, maxY, color: 0xabddff };
            }
          }

          const verticalAlignments = [
            // Vertical alignments
            { delta: entityBounds.minY - targetBounds.minY, line: entityBounds.minY }, // top-to-top
            { delta: entityBounds.maxY - targetBounds.maxY, line: entityBounds.maxY }, // bottom-to-bottom
            { delta: entityBounds.minY - targetBounds.maxY, line: entityBounds.minY }, // bottom-to-top
            { delta: entityBounds.maxY - targetBounds.minY, line: entityBounds.maxY }, // top-to-bottom
          ];

          for (const alignment of verticalAlignments) {
            if (Math.abs(alignment.delta) < bestSnapDistanceY && alignment.delta !== 0) {
              snapY = world.y + alignment.delta;
              bestSnapDistanceY = Math.abs(alignment.delta);

              const minX = Math.min(entityBounds.minX, targetBounds.minX);
              const maxX = Math.max(entityBounds.maxX, targetBounds.maxX);

              bestYSnapInfo = { line: alignment.line, minX, maxX, color: 0xabddff };
            }
          }

          // Center-to-center snapping
          const dxCenter = entityCenter.x - targetCenter.x;
          const dyCenter = entityCenter.y - targetCenter.y;

          if (Math.abs(dxCenter) < bestSnapDistanceX && dxCenter !== 0) {
            snapX = world.x + dxCenter;
            bestSnapDistanceX = Math.abs(dxCenter);

            const minY = Math.min(entityBounds.minY, targetBounds.minY);
            const maxY = Math.max(entityBounds.maxY, targetBounds.maxY);

            bestXSnapInfo = { line: entityCenter.x, minY, maxY, color: 0x9d6bff };
          }

          if (Math.abs(dyCenter) < bestSnapDistanceY && dyCenter !== 0) {
            snapY = world.y + dyCenter;
            bestSnapDistanceY = Math.abs(dyCenter);

            const minX = Math.min(entityBounds.minX, targetBounds.minX);
            const maxX = Math.max(entityBounds.maxX, targetBounds.maxX);

            bestYSnapInfo = { line: entityCenter.y, minX, maxX, color: 0x9d6bff };
          }
        }

        // Draw only the best snap candidates when moving on both axes
        if (this.#action.axis === "both") {
          if (bestXSnapInfo) {
            this.#snapLinesGfx!.context.moveTo(bestXSnapInfo.line, -bestXSnapInfo.minY)
              .lineTo(bestXSnapInfo.line, -bestXSnapInfo.maxY)
              .stroke({ color: bestXSnapInfo.color, width: 0.03, pixelLine: true });
          }
          if (bestYSnapInfo) {
            this.#snapLinesGfx!.context.moveTo(bestYSnapInfo.minX, -bestYSnapInfo.line)
              .lineTo(bestYSnapInfo.maxX, -bestYSnapInfo.line)
              .stroke({ color: bestYSnapInfo.color, width: 0.03, pixelLine: true });
          }
        }

        // Apply snap adjustments only when moving on both axes
        if (snapX !== undefined && this.#action.axis === "both") world.x = snapX;
        if (snapY !== undefined && this.#action.axis === "both") world.y = snapY;
      }

      this.#target[0].globalTransform.position = world.add(this.#target[1]);
      for (const [entity, offset] of this.#auxTargets) {
        entity.globalTransform.position = world.add(offset);
      }

      const entities = [this.#target[0], ...this.#auxTargets.keys()].map(entity => ({
        entity,
        transform: entity.globalTransform.clone(),
      }));

      this.fire(GizmoUpdateMove, "translate", entities);
    } else if (this.#action.type === "rotate") {
      const pos = cursor.world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);

      const rotation = -rot + this.#action.offset;

      if (this.#auxTargets.size) {
        const deltaRot = rotation - this.#target[0].globalTransform.rotation;

        const entities = [this.#target[0], ...this.#auxTargets.keys()];
        for (const entity of entities) {
          entity.globalTransform.position = Vector2.rotateAbout(
            entity.pos,
            deltaRot,
            this.#action.origin,
          );
          entity.globalTransform.rotation += deltaRot;
        }

        this.#updateTargetOffsets();
      } else {
        this.#target[0].globalTransform.rotation = rotation;
      }

      // ugliest syntax ever award 2025
      const entities = (
        this.#auxTargets.size
          ? [this.#target[0], ...this.#auxTargets.keys()]
          : [this.#target[0]]
      ).map(entity => ({
        entity,
        transform: entity.globalTransform.clone(),
      }));

      this.fire(GizmoUpdateMove, "rotate", entities);
    } else if (this.#action.type === "scale") {
      const originalDistance = this.#action.offset.magnitude();
      const offset = cursor.world.sub(this.globalTransform.position);
      const offsetDistance = offset.magnitude();

      const mul = Vector2.splat(offsetDistance / originalDistance);
      if (this.#action.axis === "x") mul.y = 1;
      if (this.#action.axis === "y") mul.x = 1;

      if (this.#auxTargets.size) {
        const entities = [this.#target[0], ...this.#auxTargets.keys()];
        for (const entity of entities) {
          // explode out from center
          const orig = this.#action.originals.get(entity)!;
          const delta = orig.position.sub(this.#action.origin);

          entity.globalTransform.position = this.#action.origin.add(delta.mul(mul));

          const scale = orig.scale.mul(mul);
          if (entity instanceof Camera || entity instanceof EditorFacadeCamera) {
            entity.zoom = 1 / (this.#action.axis === "y" ? scale.y : scale.x);
          } else {
            entity.globalTransform.scale = scale;
          }
        }

        this.#updateTargetOffsets();
      } else {
        const scale = this.#action.originals.get(this.#target[0])!.scale.mul(mul);

        if (
          this.#target[0] instanceof Camera ||
          this.#target[0] instanceof EditorFacadeCamera
        ) {
          this.#target[0].zoom = 1 / (this.#action.axis === "y" ? scale.y : scale.x);
        } else {
          this.#target[0].globalTransform.scale = scale;
        }
      }

      // make sure to extend this array for multiselect
      this.fire(GizmoUpdateMove, "scale", [
        { entity: this.#target[0], transform: this.#target[0].globalTransform.clone() },
      ]);
    }
  };

  #onMouseUp = (_: PointerEvent) => {
    if (!this.#action) return;
    if (!this.#target) {
      console.warn("mouse released without target, events will not fire");
      this.#action = undefined;
      return;
    }

    const entities = [this.#target[0], ...this.#auxTargets.keys()].map(entity => ({
      entity,
      transform: entity.globalTransform.clone(),
      previous: this.#action?.originals.get(entity)!,
    }));

    const signal = [GizmoUpdateEnd, this.#action.type, entities] as const;
    this.fire(...signal);
    this.game.fire(...signal);

    this.#action = undefined;
  };
  // #endregion

  #target: [Entity, Vector2] | undefined;
  get target(): Entity | undefined {
    return this.#target?.[0];
  }
  set target(value: Entity | undefined) {
    if (this.#target) this.#target[0].unregister(EntityDestroyed, this.#onTargetDestroyed);

    this.#target = value ? [value, Vector2.ZERO] : undefined;
    this.#updateTargetOffsets();
    if (this.#gfx) this.#gfx.context = this.#ctx;
    this.#updateHandles();
    if (this.#target) this.#target[0].on(EntityDestroyed, this.#onTargetDestroyed);
  }

  #onTargetDestroyed = () => {
    this.target = undefined;
  };

  #auxTargets = new Map<Entity, Vector2>();
  get auxTargets(): Entity[] {
    return [...this.#auxTargets.keys()];
  }
  set auxTargets(value) {
    this.#auxTargets.clear();

    const sorted = value.toSorted((a, b) => a.depth - b.depth);
    for (const entity of sorted) this.#auxTargets.set(entity, Vector2.ZERO);
    this.#updateTargetOffsets();
  }

  #calculateAvgPosition(): Vector2 {
    if (this.#target === undefined) throw new Error("invalid average access");

    const allEntities = [this.#target[0], ...this.auxTargets];
    const sum = new Vector2(0, 0);

    for (const entity of allEntities) {
      sum.x += entity.globalTransform.position.x;
      sum.y += entity.globalTransform.position.y;
    }

    return new Vector2(sum.x / allEntities.length, sum.y / allEntities.length);
  }

  #updateTargetOffsets() {
    // zero the offsets when target is undefined
    if (this.#target === undefined) {
      for (const vector of this.#auxTargets.values()) {
        vector.assign(Vector2.ZERO);
      }

      return;
    }

    const pos = this.#calculateAvgPosition();
    this.#target[1].assign(this.#target[0].pos.sub(pos));

    for (const [entity, offset] of this.#auxTargets) {
      offset.assign(entity.pos.sub(pos));
    }
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    // Must be a local entity
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error(`${this.constructor.name} must be spawned as a local client entity`);
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#gfx) return;

      const currentPaintingState =
        this.#target?.[0] instanceof EditorFacadeTilemap && this.#target[0].shouldPaint();
      if (currentPaintingState !== this.#lastPaintingState) {
        this.#gfx.context = this.#ctx;
        this.#lastPaintingState = currentPaintingState;
        this.#updateHandles();
      }

      if (this.#target) {
        const averagePosition = this.#calculateAvgPosition();
        this.globalTransform.position = averagePosition;
        this.globalTransform.rotation = this.#target[0].globalTransform.rotation;
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

  static computeGlobalBounds(entity: Entity) {
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

  static getTransformedCorners(entity: Entity) {
    // Get the actual transformed corners (not just bounding box)
    const half = {
      x: 0.5 * entity.globalTransform.scale.x,
      y: 0.5 * entity.globalTransform.scale.y,
    };

    // Corners in local space
    const localCorners = [
      new Vector2(half.x, half.y), // top-right
      new Vector2(-half.x, half.y), // top-left
      new Vector2(-half.x, -half.y), // bottom-left
      new Vector2(half.x, -half.y), // bottom-right
    ];

    const pos = entity.globalTransform.position;
    const rot = entity.globalTransform.rotation;
    const sin = Math.sin(rot);
    const cos = Math.cos(rot);

    // Transform corners to world space
    return localCorners.map(corner => {
      const x = corner.x * cos - corner.y * sin + pos.x;
      const y = corner.x * sin + corner.y * cos + pos.y;
      return { x, y };
    });
  }

  static computeAABBForEntities(entities: Entity[]) {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const entity of entities) {
      const bounds = Gizmo.computeGlobalBounds(entity);
      minX = Math.min(minX, bounds.minX);
      maxX = Math.max(maxX, bounds.maxX);
      minY = Math.min(minY, bounds.minY);
      maxY = Math.max(maxY, bounds.maxY);
    }

    return { minX, maxX, minY, maxY };
  }

  static getAABBCorners(bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
    return [
      { x: bounds.maxX, y: bounds.maxY }, // top-right
      { x: bounds.minX, y: bounds.maxY }, // top-left
      { x: bounds.minX, y: bounds.minY }, // bottom-left
      { x: bounds.maxX, y: bounds.minY }, // bottom-right
    ];
  }
}
