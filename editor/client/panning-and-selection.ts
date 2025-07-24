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
import { BoxResizeGizmo, Gizmo } from "../common/entities/mod.ts";
import { EditorMetadataEntity } from "../common/mod.ts";
import { InspectorUI } from "./ui/inspector.ts";
import { EmptyFacade } from "../common/facades/empty.ts";
import { EditorFacadeTilemap } from "../common/facades/tilemap.ts";

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

    this.#camera.zoom = 0.15;

    this.listen(this.#space, ActionChanged, ({ value }) => {
      if (value) canvas.classList.add("grab");
      else canvas.classList.remove("grab");
    });
  }

  #setDrag(value: Vector2 | undefined) {
    this.#drag = value;

    if (!this.game.isClient()) return;
    const canvas = this.game.renderer.app.canvas;

    if (value === undefined) canvas.classList.remove("grabbing");
    else canvas.classList.add("grabbing");
  }

  #onMouseDown(event: MouseDown) {
    if (!this.game.isClient()) return;
    if (event.button === "left") {
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
    } else if (event.button === "middle") {
      this.#setDrag(event.cursor.screen.clone());
    }
  }

  #lastClickTime = 0;

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

  #onMouseUp(event: MouseUp) {
    if (!this.game.isClient()) return;

    if (this.#drag) this.#setDrag(undefined);

    if (this.ui?.selectedEntity.entities[0] instanceof EditorFacadeTilemap) {
      return;
    }

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
        });

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

      if (newTarget && event.ev.shiftKey) {
        if (gizmo) gizmo.auxTargets = [...gizmo.auxTargets, newTarget];
        if (this.ui)
          this.ui.selectedEntity.entities = [...this.ui.selectedEntity.entities, newTarget];
      } else {
        if (gizmo) gizmo.target = newTarget;
        if (boxresize) boxresize.target = newTarget;
        if (this.ui) this.ui.selectedEntity.entities = newTarget ? [newTarget] : [];
      }

      this.#lastClickTime = currentTime;
    }

    this.#wasGizmo = false;
  }

  #onMouseMove({ cursor }: MouseMove) {
    if (!this.game.isClient()) return;
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
