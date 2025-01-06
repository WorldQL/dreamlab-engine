import {
  ActionChanged,
  Behavior,
  BoxResizeGizmo,
  Camera,
  ClickableCircle,
  Entity,
  Gizmo,
  MouseDown,
  MouseMove,
  MouseOut,
  MouseOver,
  MouseUp,
  Scroll,
  Vector2,
} from "@dreamlab/engine";
import { InspectorUI } from "./ui/inspector.ts";

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
          const isRotate = entity instanceof ClickableCircle && entity.parent instanceof Gizmo;
          if (!isRotate) return true;

          return entity.isInBounds(event.cursor.world);
        });

      this.#wasGizmo = local.length > 0;
    } else if (event.button === "middle") {
      this.#setDrag(event.cursor.screen.clone());
    }
  }

  #lastClickTime = 0;

  #onMouseUp(event: MouseUp) {
    if (!this.game.isClient()) return;

    if (this.#drag) this.#setDrag(undefined);

    if (!this.#drag && event.button === "left" && event.cursor.world && !this.#wasGizmo) {
      const gizmo = this.game.local.children.get("Gizmo")?.cast(Gizmo);
      const boxresize = this.game.local.children.get("BoxResizeGizmo")?.cast(BoxResizeGizmo);
      if (!gizmo && !boxresize) return;

      const entities = this.game.entities
        .lookupByPosition(event.cursor.world)
        .filter(entity => entity.enabled)
        .filter(entity => this.ui?.sceneGraph?.entryElementMap?.has(entity.ref) ?? true)
        .toSorted((a, b) => {
          const depthA = getDepth(a);
          const depthB = getDepth(b);
          if (depthA !== depthB) return depthA - depthB;
          return b.z - a.z;
        });

      const currentTime = Date.now();
      const target = gizmo?.target ?? boxresize?.target;

      let currentIdx = target ? entities.indexOf(target) : 0;
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
      if (gizmo) gizmo.target = newTarget;
      if (boxresize) boxresize.target = newTarget;
      if (this.ui) this.ui.selectedEntity.entities = newTarget ? [newTarget] : [];

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
      // @ts-expect-error non-standard
      TOUCHPAD_DETECTED = ev.wheelDeltaY // @ts-expect-error non-standard
        ? ev.wheelDeltaY === -3 * ev.deltaY
        : ev.deltaMode === 0;
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
}

function getDepth(e: Entity): number {
  let depth = 1;
  let pointer = e?.parent;

  // We can't do "instanceof EditorRootFacadeEntity" here because it's a descendant of this class
  // so we have to do this string check for facade roots instead
  while (
    pointer?.parent &&
    pointer.constructor.name !== "WorldRootFacade" &&
    pointer.constructor.name !== "LocalRootFacade" &&
    pointer.constructor.name !== "ServerRootFacade" &&
    pointer.constructor.name !== "PrefabRootFacade"
  ) {
    pointer = pointer?.parent;
    depth++;
  }

  return depth;
}
