import {
  ActionChanged,
  Behavior,
  Camera,
  Clickable,
  Entity,
  MouseDown,
  MouseMove,
  MouseOut,
  MouseOver,
  MouseUp,
  Scroll,
  Vector2,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { BoxResizeGizmo, Gizmo } from "../common/entities/mod.ts";
import { EmptyFacade } from "../common/facades/empty.ts";
import { EditorFacadeTilemap } from "../common/facades/tilemap.ts";
import { EditorMetadataEntity } from "../common/mod.ts";
import { InspectorUI } from "./ui/inspector.ts";

const PINCH_THRESHOLD = 50; // px   – mouse wheels are almost always > 100
const SCROLL_THRESHOLD = 15; // px   – track‑pad two‑finger scrolls are small

function isPinch(ev: WheelEvent) {
  return (ev.ctrlKey || ev.metaKey) && Math.abs(ev.deltaY) < PINCH_THRESHOLD && ev.deltaY !== 0;
}

function isTrackpadScroll(ev: WheelEvent) {
  return (
    // @ts-expect-error non-standard
    ev.wheelDeltaY === -3 * ev.deltaY &&
    ev.deltaY !== 0 &&
    Math.abs(ev.deltaY) < SCROLL_THRESHOLD
  );
}

let TOUCHPAD_DETECTED = false;
export class CameraPanBehavior extends Behavior {
  ui: InspectorUI | undefined;

  #camera = this.entity.cast(Camera);
  #hover = false;
  #drag: Vector2 | undefined = undefined;
  #wasGizmo: boolean = false;
  #space = this.game.inputs.create("@editor/cameragrip", "Camera Grip", "Space");
  #selectionBox: { start: Vector2; current: Vector2; gfx: PIXI.Graphics } | undefined;
  #selectionHighlights: Map<Entity, PIXI.Graphics> = new Map();

  onInitialize(): void {
    if (!this.game.isClient()) return;

    const canvas = this.game.renderer.app.canvas;
    this.#hover = canvas.matches(":hover");

    this.listen(this.game.inputs, MouseDown, this.#onMouseDown.bind(this));
    this.listen(this.game.inputs, MouseMove, this.#onMouseMove.bind(this));
    this.listen(this.game.inputs, MouseUp, this.#onMouseUp.bind(this));
    this.listen(this.game.inputs, MouseOver, this.#onMouseOver.bind(this));
    this.listen(this.game.inputs, MouseOut, this.#onMouseOut.bind(this));
    this.listen(this.game.inputs, Scroll, this.#onScroll.bind(this));

    this.#camera.zoom = 0.3;

    this.listen(this.#space, ActionChanged, ({ value }) => {
      if (value) canvas.classList.add("grab");
      else canvas.classList.remove("grab");
    });

    this.game.time.waitForNextTick().then(() => {
      this.ui!.selectedEntity.listen(() => {
        // when we unselect everything, clear the flag that prevents us from repeatedly selecting an empty parent.
        if (this.ui?.selectedEntity.entities.length === 0) {
          this.#lastParentPrepended = undefined;
        }
      });
    });
  }

  #ignoreTilemap(): boolean {
    const entity = this.ui?.selectedEntity.entities[0];
    if (!entity) return false;
    if (!(entity instanceof EditorFacadeTilemap)) return false;

    // TODO: need inspector ui root instead of document (prevent crosstalk between edit and play)
    return document.querySelector("[data-tab-id=tilemap][data-active]") !== null;
  }

  #setDrag(value: Vector2 | undefined) {
    this.#drag = value;

    if (!this.game.isClient()) return;
    const canvas = this.game.renderer.app.canvas;

    if (value === undefined) canvas.classList.remove("grabbing");
    else canvas.classList.add("grabbing");
  }

  #wasMouseDownOverCanvas: boolean = false;
  #onMouseDown(event: MouseDown) {
    if (!this.game.isClient()) return;
    if (event.button === "left") {
      this.#wasMouseDownOverCanvas = this.game.inputs.cursor.world !== undefined;

      if (this.#space.held) {
        this.#setDrag(event.cursor.screen.clone());
        return;
      }
      // Ignore click event if mouse is over a local entity (clickable for gizmo)
      const local = this.game.local.entities
        .lookupByPosition(event.cursor.world)
        .filter(entity => entity.enabled)
        .filter(entity => {
          // fix big rotate gizmo hitbox
          const isRotate = entity instanceof Clickable && entity.parent instanceof Gizmo;
          if (!isRotate) return true;

          return entity.isInBounds(event.cursor.world);
        });

      this.#wasGizmo = local.length > 0;

      if (!this.#wasGizmo && event.cursor.world) {
        if (this.#ignoreTilemap()) return;

        const entities = this.game.entities
          .lookupByPosition(event.cursor.world)
          .filter(entity => entity.enabled)
          .filter(entity => this.ui?.sceneGraph?.entryElementMap?.has(entity.ref) ?? true)
          .filter(entity => EditorMetadataEntity.getLockedBy(entity) === undefined);

        if (entities.length === 0) {
          this.#startSelectionBox(event.cursor.world);
        }
      }
    } else if (event.button === "middle") {
      this.#setDrag(event.cursor.screen.clone());
    }
  }

  #lastClickTime = 0;

  #startSelectionBox(worldPos: Vector2) {
    if (!this.game.isClient()) return;

    this.#clearAllHighlights();

    const gfx = new PIXI.Graphics();
    gfx.zIndex = 10000000000;
    this.game.renderer.scene.addChild(gfx);

    this.#selectionBox = {
      start: worldPos.clone(),
      current: worldPos.clone(),
      gfx,
    };
  }

  #highlightEntity(entity: Entity) {
    if (!this.game.isClient()) return;
    if (this.#selectionHighlights.has(entity)) return;

    const bounds = entity.bounds;
    if (!bounds) return;

    const gfx = new PIXI.Graphics();
    gfx.zIndex = 9999999999;
    this.game.renderer.scene.addChild(gfx);

    const entityPos = entity.globalTransform.position;
    const entityScale = entity.globalTransform.scale;
    const entityRotation = entity.globalTransform.rotation;
    const halfWidth = (bounds.width * entityScale.x) / 2;
    const halfHeight = (bounds.height * entityScale.y) / 2;

    gfx.position = { x: entityPos.x, y: -entityPos.y };
    gfx.rotation = -entityRotation;

    gfx.context
      .rect(
        -halfWidth,
        -halfHeight,
        bounds.width * entityScale.x,
        bounds.height * entityScale.y,
      )
      .stroke({ color: 0x22a2ff, width: 0.08, alpha: 0.9 });

    this.#selectionHighlights.set(entity, gfx);
  }

  #unhighlightEntity(entity: Entity) {
    if (!this.game.isClient()) return;
    const gfx = this.#selectionHighlights.get(entity);
    if (gfx) {
      gfx.destroy();
      this.#selectionHighlights.delete(entity);
    }
  }

  #clearAllHighlights() {
    if (!this.game.isClient()) return;
    for (const [_entity, gfx] of this.#selectionHighlights) {
      gfx.destroy();
    }
    this.#selectionHighlights.clear();
  }

  #updateSelectionBox(worldPos: Vector2) {
    if (!this.#selectionBox || !this.game.isClient()) return;

    this.#selectionBox.current = worldPos;
    const { start, current, gfx } = this.#selectionBox;

    gfx.clear();

    const minX = Math.min(start.x, current.x);
    const minY = Math.min(start.y, current.y);
    const maxX = Math.max(start.x, current.x);
    const maxY = Math.max(start.y, current.y);

    const width = maxX - minX;
    const height = maxY - minY;

    gfx.context
      .rect(minX, -maxY, width, height)
      .fill({ color: 0x22a2ff, alpha: 0.1 })
      .stroke({ color: 0x22a2ff, width: 0.05, alpha: 0.8 });

    const currentlyHighlighted = new Set<Entity>();
    const MIN_SELECTION_SIZE = 0.1;

    if (
      Math.abs(maxX - minX) > MIN_SELECTION_SIZE ||
      Math.abs(maxY - minY) > MIN_SELECTION_SIZE
    ) {
      for (const entity of this.game.entities) {
        if (!entity.enabled) continue;
        if (
          this.ui?.sceneGraph?.entryElementMap &&
          !this.ui.sceneGraph.entryElementMap.has(entity.ref)
        )
          continue;
        if (EditorMetadataEntity.getLockedBy(entity) !== undefined) continue;
        if (entity instanceof Gizmo || entity.parent instanceof Gizmo) continue;
        if (entity instanceof BoxResizeGizmo || entity.parent instanceof BoxResizeGizmo)
          continue;

        const bounds = entity.bounds;
        if (!bounds) continue;

        const entityPos = entity.globalTransform.position;
        const entityScale = entity.globalTransform.scale;
        const entityRotation = entity.globalTransform.rotation;

        let shouldHighlight = false;

        if (Math.abs(entityRotation) < 0.001) {
          const halfWidth = (bounds.width * entityScale.x) / 2;
          const halfHeight = (bounds.height * entityScale.y) / 2;

          const entityMinX = entityPos.x - halfWidth;
          const entityMaxX = entityPos.x + halfWidth;
          const entityMinY = entityPos.y - halfHeight;
          const entityMaxY = entityPos.y + halfHeight;

          if (
            entityMinX >= minX &&
            entityMaxX <= maxX &&
            entityMinY >= minY &&
            entityMaxY <= maxY
          ) {
            shouldHighlight = true;
          }
        } else {
          const halfWidth = (bounds.width * entityScale.x) / 2;
          const halfHeight = (bounds.height * entityScale.y) / 2;

          const corners = [
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight },
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
          ];

          const sin = Math.sin(entityRotation);
          const cos = Math.cos(entityRotation);

          for (const corner of corners) {
            const x = corner.x * cos - corner.y * sin + entityPos.x;
            const y = corner.x * sin + corner.y * cos + entityPos.y;
            corner.x = x;
            corner.y = y;
          }

          const allCornersInside = corners.every(
            corner =>
              corner.x >= minX && corner.x <= maxX && corner.y >= minY && corner.y <= maxY,
          );

          if (allCornersInside) {
            shouldHighlight = true;
          }
        }

        if (shouldHighlight) {
          currentlyHighlighted.add(entity);
          this.#highlightEntity(entity);
        }
      }
    }

    for (const [entity, _gfx] of this.#selectionHighlights) {
      if (!currentlyHighlighted.has(entity)) {
        this.#unhighlightEntity(entity);
      }
    }
  }

  #finishSelectionBox() {
    if (!this.#selectionBox || !this.game.isClient()) return;

    const { start, current } = this.#selectionBox;

    const minX = Math.min(start.x, current.x);
    const minY = Math.min(start.y, current.y);
    const maxX = Math.max(start.x, current.x);
    const maxY = Math.max(start.y, current.y);

    const candidateEntities: Entity[] = [];

    const MIN_SELECTION_SIZE = 0.1;
    if (
      Math.abs(maxX - minX) > MIN_SELECTION_SIZE ||
      Math.abs(maxY - minY) > MIN_SELECTION_SIZE
    ) {
      for (const entity of this.game.entities) {
        if (!entity.enabled) continue;
        if (
          this.ui?.sceneGraph?.entryElementMap &&
          !this.ui.sceneGraph.entryElementMap.has(entity.ref)
        )
          continue;
        if (EditorMetadataEntity.getLockedBy(entity) !== undefined) continue;
        if (entity instanceof Gizmo || entity.parent instanceof Gizmo) continue;
        if (entity instanceof BoxResizeGizmo || entity.parent instanceof BoxResizeGizmo)
          continue;

        const bounds = entity.bounds;
        if (!bounds) continue;

        const entityPos = entity.globalTransform.position;
        const entityScale = entity.globalTransform.scale;
        const entityRotation = entity.globalTransform.rotation;

        if (Math.abs(entityRotation) < 0.001) {
          const halfWidth = (bounds.width * entityScale.x) / 2;
          const halfHeight = (bounds.height * entityScale.y) / 2;

          const entityMinX = entityPos.x - halfWidth;
          const entityMaxX = entityPos.x + halfWidth;
          const entityMinY = entityPos.y - halfHeight;
          const entityMaxY = entityPos.y + halfHeight;

          if (
            entityMinX >= minX &&
            entityMaxX <= maxX &&
            entityMinY >= minY &&
            entityMaxY <= maxY
          ) {
            candidateEntities.push(entity);
          }
        } else {
          const halfWidth = (bounds.width * entityScale.x) / 2;
          const halfHeight = (bounds.height * entityScale.y) / 2;

          const corners = [
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight },
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
          ];

          const sin = Math.sin(entityRotation);
          const cos = Math.cos(entityRotation);

          for (const corner of corners) {
            const x = corner.x * cos - corner.y * sin + entityPos.x;
            const y = corner.x * sin + corner.y * cos + entityPos.y;
            corner.x = x;
            corner.y = y;
          }

          const allCornersInside = corners.every(
            corner =>
              corner.x >= minX && corner.x <= maxX && corner.y >= minY && corner.y <= maxY,
          );

          if (allCornersInside) {
            candidateEntities.push(entity);
          }
        }
      }
    }

    let selectedEntities = candidateEntities.filter(entity => {
      let current = entity.parent;
      while (current) {
        if (candidateEntities.includes(current)) {
          return false;
        }
        current = current.parent;
      }
      return true;
    });

    // Helper function to check if an entity is within the selection box bounds
    const isEntityInBounds = (entity: Entity): boolean => {
      const bounds = entity.bounds;
      const entityPos = entity.globalTransform.position;

      // If no bounds, just check if the position is within the selection box
      if (!bounds) {
        return (
          entityPos.x >= minX &&
          entityPos.x <= maxX &&
          entityPos.y >= minY &&
          entityPos.y <= maxY
        );
      }

      const entityScale = entity.globalTransform.scale;
      const entityRotation = entity.globalTransform.rotation;

      if (Math.abs(entityRotation) < 0.001) {
        const halfWidth = (bounds.width * entityScale.x) / 2;
        const halfHeight = (bounds.height * entityScale.y) / 2;

        const entityMinX = entityPos.x - halfWidth;
        const entityMaxX = entityPos.x + halfWidth;
        const entityMinY = entityPos.y - halfHeight;
        const entityMaxY = entityPos.y + halfHeight;

        return (
          entityMinX >= minX && entityMaxX <= maxX && entityMinY >= minY && entityMaxY <= maxY
        );
      } else {
        const halfWidth = (bounds.width * entityScale.x) / 2;
        const halfHeight = (bounds.height * entityScale.y) / 2;

        const corners = [
          { x: halfWidth, y: halfHeight },
          { x: -halfWidth, y: halfHeight },
          { x: -halfWidth, y: -halfHeight },
          { x: halfWidth, y: -halfHeight },
        ];

        const sin = Math.sin(entityRotation);
        const cos = Math.cos(entityRotation);

        for (const corner of corners) {
          const x = corner.x * cos - corner.y * sin + entityPos.x;
          const y = corner.x * sin + corner.y * cos + entityPos.y;
          corner.x = x;
          corner.y = y;
        }

        return corners.every(
          corner =>
            corner.x >= minX && corner.x <= maxX && corner.y >= minY && corner.y <= maxY,
        );
      }
    };

    let processedEntities = [...selectedEntities];
    let changed = true;

    while (changed) {
      changed = false;
      const parentGroups = new Map<Entity, Entity[]>();

      for (const entity of processedEntities) {
        if (entity.parent) {
          if (!parentGroups.has(entity.parent)) {
            parentGroups.set(entity.parent, []);
          }
          parentGroups.get(entity.parent)!.push(entity);
        }
      }

      const toRemove = new Set<Entity>();
      const toAdd: Entity[] = [];

      for (const [parent, children] of parentGroups) {
        const allParentChildren = Array.from(parent.children.values()).filter(
          e => !(e instanceof EditorMetadataEntity),
        );

        if (
          children.length === allParentChildren.length &&
          (parent instanceof EmptyFacade || isEntityInBounds(parent))
        ) {
          for (const child of children) {
            toRemove.add(child);
          }
          toAdd.push(parent);
          changed = true;
        }
      }

      if (changed) {
        processedEntities = processedEntities.filter(e => !toRemove.has(e));
        processedEntities.push(...toAdd);
      }
    }

    selectedEntities = processedEntities;

    this.#selectionBox.gfx.destroy();
    this.#selectionBox = undefined;
    this.#clearAllHighlights();

    const gizmo = this.game.local.children.get("Gizmo")?.cast(Gizmo);
    const boxresize = this.game.local.children.get("BoxResizeGizmo")?.cast(BoxResizeGizmo);

    if (selectedEntities.length > 0) {
      if (gizmo) {
        gizmo.target = selectedEntities[0];
        gizmo.auxTargets = selectedEntities.slice(1);
      }
      if (boxresize) {
        boxresize.target = selectedEntities[0];
        boxresize.auxTargets = selectedEntities.slice(1);
      }
      if (this.ui) {
        this.ui.selectedEntity.entities = selectedEntities;
      }
    } else {
      if (gizmo) {
        gizmo.target = undefined;
        gizmo.auxTargets = [];
      }
      if (boxresize) {
        boxresize.target = undefined;
        boxresize.auxTargets = [];
      }
      if (this.ui) {
        this.ui.selectedEntity.entities = [];
      }
    }
  }

  #isPointInComplexCollider(entity: Entity, point: Vector2): boolean {
    const children = [...entity.children.values()]
      .filter(child => child.name !== "__EditorMetadata")
      .map(child => child.pos);

    if (children.length < 3) return false;

    // Point-in-polygon algorithm (ray casting)
    // thank you claude
    let inside = false;
    for (let i = 0, j = children.length - 1; i < children.length; j = i++) {
      const xi = children[i].x,
        yi = children[i].y;
      const xj = children[j].x,
        yj = children[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  #lastParentPrepended: undefined | EmptyFacade = undefined;

  #onMouseUp(event: MouseUp) {
    if (!this.game.isClient()) return;

    const wasMouseDownOverCanvas = this.#wasMouseDownOverCanvas;
    this.#wasMouseDownOverCanvas = false;

    if (this.#drag) this.#setDrag(undefined);

    if (this.#selectionBox) {
      this.#finishSelectionBox();
      return;
    }

    if (this.#ignoreTilemap()) return;

    if (!wasMouseDownOverCanvas) return;
    if (!this.#drag && event.button === "left" && event.cursor.world && !this.#wasGizmo) {
      const gizmo = this.game.local.children.get("Gizmo")?.cast(Gizmo);
      const boxresize = this.game.local.children.get("BoxResizeGizmo")?.cast(BoxResizeGizmo);
      if (!gizmo && !boxresize) return;

      const entities = this.game.entities
        .lookupByPosition(event.cursor.world)
        .filter(entity => entity.enabled)
        .filter(entity => this.ui?.sceneGraph?.entryElementMap?.has(entity.ref) ?? true)
        .filter(entity => EditorMetadataEntity.getLockedBy(entity) === undefined)
        .filter(entity => {
          // Special case for ComplexCollider
          if (entity.constructor.name === "EditorFacadeComplexCollider" && event.cursor.world) {
            return this.#isPointInComplexCollider(entity, event.cursor.world);
          }
          return true;
        })
        .toSorted((a, b) => {
          const depthA = a.depth;
          const depthB = b.depth;
          if (depthA !== depthB) return depthA - depthB;
          return b.z - a.z;
        })
        .toSorted((a, b) => {
          // special case: prioritize complex collider verticies if they're visible
          if (a instanceof EmptyFacade && a.isColliderChildAndSelected) {
            return -1;
          }
          if (b instanceof EmptyFacade && b.isColliderChildAndSelected) {
            return 1;
          }
          return 0;
        })
        .toSorted((a, b) => {
          // Move tilemaps to the bottom of the selection list
          const aIsTilemap = a instanceof EditorFacadeTilemap;
          const bIsTilemap = b instanceof EditorFacadeTilemap;
          if (aIsTilemap && !bIsTilemap) return 1;
          if (!aIsTilemap && bIsTilemap) return -1;
          return 0;
        });

      if (entities[0] && entities[0].parent instanceof EmptyFacade) {
        if (this.#lastParentPrepended !== entities[0].parent) {
          this.#lastParentPrepended = entities[0].parent;
          entities.unshift(entities[0].parent);
        }
      }

      const currentTime = Date.now();
      const target = gizmo?.target ?? boxresize?.target;

      let currentIdx = target ? entities.indexOf(target) : 0;
      if (entities[0] instanceof EmptyFacade && entities[0].isColliderChildAndSelected) {
        currentIdx = 0; // special case: prioritize complex collider verticies if they're visible
      }
      let queryEntity = entities[currentIdx];

      const timeDiff = currentTime - this.#lastClickTime;
      const shouldUpdateIndex = timeDiff < 300 && entities.length > 1;

      if (shouldUpdateIndex) {
        currentIdx = (currentIdx + 1) % entities.length;
        queryEntity = entities[currentIdx];
      }

      if (currentIdx === -1) {
        currentIdx = 0;
        queryEntity = entities[currentIdx];
      }

      const newTarget = entities.length > 0 ? queryEntity : undefined;

      if (newTarget && (event.ev.shiftKey || event.ev.ctrlKey)) {
        const currentEntities = this.ui?.selectedEntity.entities || [];
        // Don't add duplicate entities
        const newEntities = currentEntities.includes(newTarget)
          ? currentEntities
          : [...currentEntities, newTarget];

        if (newEntities.length === 1) {
          if (gizmo) {
            gizmo.target = newTarget;
            gizmo.auxTargets = [];
          }
          if (boxresize) {
            boxresize.target = newTarget;
            boxresize.auxTargets = [];
          }
        } else {
          // Don't add the target entity to aux targets if it's already the main target
          if (gizmo && gizmo.target !== newTarget)
            gizmo.auxTargets = [...gizmo.auxTargets, newTarget];
          if (boxresize && boxresize.target !== newTarget)
            boxresize.auxTargets = [...boxresize.auxTargets, newTarget];
        }

        if (this.ui) this.ui.selectedEntity.entities = newEntities;
      } else {
        if (gizmo) {
          gizmo.target = newTarget;
          gizmo.auxTargets = [];
        }
        if (boxresize) {
          boxresize.target = newTarget;
          boxresize.auxTargets = [];
        }
        if (this.ui) this.ui.selectedEntity.entities = newTarget ? [newTarget] : [];
      }

      this.#lastClickTime = currentTime;
    }

    this.#wasGizmo = false;
  }

  #onMouseMove({ cursor }: MouseMove) {
    if (!this.game.isClient()) return;

    if (this.#selectionBox && cursor.world) {
      this.#updateSelectionBox(cursor.world);
      return;
    }

    if (!this.#drag) return;
    if (!this.#hover) return;

    const delta = this.#drag.sub(cursor.screen);
    this.#setDrag(cursor.screen.clone());

    const worldDelta = this.#camera
      .screenToWorld(delta)
      .sub(this.#camera.screenToWorld(Vector2.ZERO));

    this.#camera.pos.assign(this.#camera.pos.add(worldDelta));
  }

  #onMouseOver() {
    this.#hover = true;
  }

  #onMouseOut() {
    this.#hover = false;
    if (this.#drag) this.#setDrag(undefined);

    // Clean up selection box if mouse leaves canvas
    if (this.#selectionBox) {
      this.#selectionBox.gfx.destroy();
      this.#selectionBox = undefined;
      this.#clearAllHighlights();
    }
  }

  #onScroll({ delta, ev }: Scroll) {
    if (this.game.isClient() && ev.target !== this.game.renderer.app.canvas) return;

    ev.preventDefault();
    ev.stopPropagation();

    if (!TOUCHPAD_DETECTED) {
      TOUCHPAD_DETECTED = isPinch(ev) || isTrackpadScroll(ev);
    }

    // mouse mode
    if (!TOUCHPAD_DETECTED) {
      if (ev.ctrlKey || ev.metaKey) {
        const scale = 100;
        const deltaX = ev.shiftKey ? delta.y : delta.x;
        const deltaY = ev.shiftKey ? 0 : delta.y;
        const scrollDelta = new Vector2(deltaX, deltaY).mul(scale);

        const worldDelta = this.#camera
          .screenToWorld(scrollDelta)
          .sub(this.#camera.screenToWorld(Vector2.ZERO));

        this.#camera.pos.assign(this.#camera.pos.add(worldDelta));
      } else {
        const zoomFactor = ev.altKey ? 1.5 : 1.1;
        const zoomDirection = delta.y > 0 ? 1 : -1;

        // TODO: untangle the reciprocals to optimize calulcation
        const newScale = (1 / this.#camera.zoom) * Math.pow(zoomFactor, zoomDirection);
        const clampedScale = Math.max(Math.min(newScale, 100), 0.1);
        this.#camera.zoom = 1 / clampedScale;

        const cursorPos = this.game.inputs.cursor.world;
        if (delta.y < 0 && cursorPos) {
          const cursorDelta = cursorPos.sub(this.#camera.pos);
          this.#camera.pos = this.#camera.pos.add(cursorDelta.mul(1 / 10));
        }
      }
    }

    // trackpad mode
    if (TOUCHPAD_DETECTED) {
      const isPan = !(ev.ctrlKey || ev.metaKey);

      if (isPan) {
        // Pan the camera with two fingers
        const scale = 100;
        const deltaX = delta.x;
        const deltaY = delta.y;
        const scrollDelta = new Vector2(deltaX, deltaY).mul(scale);

        const worldDelta = this.#camera
          .screenToWorld(scrollDelta)
          .sub(this.#camera.screenToWorld(Vector2.ZERO));

        this.#camera.pos.assign(this.#camera.pos.add(worldDelta));
      } else {
        // Zoom the camera proportionally to the pinch gesture
        const zoomAmount = ev.deltaY * 0.018; // Adjust sensitivity as needed
        const zoomFactor = Math.exp(zoomAmount);

        const newScale = (1 / this.#camera.zoom) * zoomFactor;

        // Clamp the scale to prevent extreme zoom levels
        const clampedScale = Math.max(Math.min(newScale, 100), 0.1);
        this.#camera.zoom = 1 / clampedScale;

        // Keep the zoom centered around the cursor position
        const cursorPos = this.game.inputs.cursor.world;
        if (cursorPos) {
          const beforeZoom = cursorPos.sub(this.#camera.pos);
          const afterZoom = beforeZoom.mul(zoomFactor);
          const adjustment = beforeZoom.sub(afterZoom);
          this.#camera.pos.assign(this.#camera.pos.add(adjustment));
        }
      }
    }
  }

  useUI(ui: InspectorUI) {
    ui.selectedEntity.listen(selected => {
      if (!this.game.isClient()) return;
      const gizmo = this.game.local.children.get("Gizmo")?.cast(Gizmo);
      if (!gizmo) return;

      if (selected.length) {
        // gizmo.target = selected[0];
        gizmo.auxTargets = [...selected].splice(1);
      } else {
        // gizmo.target = undefined;
        gizmo.auxTargets = [];
      }
    });
  }
}
