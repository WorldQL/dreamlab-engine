import {
  ActionChanged,
  Behavior,
  BoxResizeGizmo,
  Camera,
  ClickableCircle,
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

    this.listen(this.game.inputs, MouseDown, this.onMouseDown.bind(this));
    this.listen(this.game.inputs, MouseMove, this.onMouseMove.bind(this));
    this.listen(this.game.inputs, MouseUp, this.onMouseUp.bind(this));
    this.listen(this.game.inputs, MouseOver, this.onMouseOver.bind(this));
    this.listen(this.game.inputs, MouseOut, this.onMouseOut.bind(this));
    this.listen(this.game.inputs, Scroll, this.onScroll.bind(this));

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

  onMouseDown(event: MouseDown) {
    if (!this.game.isClient()) return;
    if (event.button === "left") {
      if (this.#space.held) {
        this.#setDrag(event.cursor.screen.clone());
        return;
      }
      // Ignore click event if mouse is over a local entity (clickable for gizmo)
      const local = this.game.local.entities
        .lookupByPosition(event.cursor.world)
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

  onMouseUp(event: MouseUp) {
    if (!this.game.isClient()) return;

    if (this.#drag) this.#setDrag(undefined);

    if (!this.#drag && event.button === "left" && event.cursor.world && !this.#wasGizmo) {
      const gizmo = this.game.local.children.get("Gizmo")?.cast(Gizmo);
      const boxresize = this.game.local.children.get("BoxResizeGizmo")?.cast(BoxResizeGizmo);
      if (!gizmo && !boxresize) return;

      const entities = this.game.entities
        .lookupByPosition(event.cursor.world)
        .filter(entity => this.ui?.sceneGraph?.entryElementMap?.has(entity.ref) ?? true)
        .toSorted((a, b) => a.z - b.z);

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

      const newTarget = entities.length > 0 ? queryEntity : undefined;
      if (gizmo) gizmo.target = newTarget;
      if (boxresize) boxresize.target = newTarget;
      if (this.ui) this.ui.selectedEntity.entities = newTarget ? [newTarget] : [];

      this.#lastClickTime = currentTime;
    }

    this.#wasGizmo = false;
  }

  onMouseMove({ cursor }: MouseMove) {
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

  onMouseOver() {
    this.#hover = true;
  }

  onMouseOut() {
    this.#hover = false;
    if (this.#drag) this.#setDrag(undefined);
  }

  static readonly #IS_MAC = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  onScroll({ delta, ev }: Scroll) {
    if (this.game.isClient() && ev.target !== this.game.renderer.app.canvas) return;

    ev.preventDefault();

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
      const newScale = this.#camera.globalTransform.scale.mul(
        Math.pow(zoomFactor, zoomDirection),
      );

      const clampedScale = newScale.max(Vector2.splat(0.1)).min(Vector2.splat(100));
      this.#camera.globalTransform.scale.assign(clampedScale);

      if (!CameraPanBehavior.#IS_MAC) {
        const cursorPos = this.game.inputs.cursor.world;
        if (delta.y < 0 && cursorPos) {
          const cursorDelta = cursorPos.sub(this.#camera.pos);
          this.#camera.pos = this.#camera.pos.add(cursorDelta.mul(1 / 10));
        }
      }
    }
  }
}
