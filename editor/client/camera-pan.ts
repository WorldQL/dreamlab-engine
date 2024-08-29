import {
  Behavior,
  BoxResizeGizmo,
  Camera,
  ClickableCircle,
  Gizmo,
  MouseDown,
  MouseMove,
  MouseUp,
  Scroll,
  Vector2,
} from "@dreamlab/engine";
import { InspectorUI } from "./ui/inspector.ts";

export class CameraPanBehavior extends Behavior {
  ui: InspectorUI | undefined;

  #camera = this.entity.cast(Camera);
  #drag: Vector2 | undefined = undefined;
  #wasGizmo: boolean = false;
  #space = this.game.inputs.create("@editor/cameragrip", "Camera Grip", "Space");

  onInitialize(): void {
    if (!this.game.isClient()) return;
    this.listen(this.game.inputs, MouseDown, this.onMouseDown.bind(this));
    this.listen(this.game.inputs, MouseMove, this.onMouseMove.bind(this));
    this.listen(this.game.inputs, MouseUp, this.onMouseUp.bind(this));
    this.listen(this.game.inputs, Scroll, this.onScroll.bind(this));
  }

  onMouseDown(event: MouseDown) {
    if (!this.game.isClient()) return;
    if (event.button === "left") {
      if (this.#space.held) {
        this.#drag = event.cursor.screen.clone();
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
      this.#drag = event.cursor.screen.clone();
    }
  }

  #lastClickTime = 0;

  onMouseUp(event: MouseUp) {
    if (!this.game.isClient()) return;

    if (this.#drag) this.#drag = undefined;

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

  onMouseMove(event: MouseMove) {
    if (!this.game.isClient()) return;
    if (!this.#drag) return;

    const delta = this.#drag.sub(event.cursor.screen);
    this.#drag = event.cursor.screen.clone();

    const worldDelta = this.#camera
      .screenToWorld(delta)
      .sub(this.#camera.screenToWorld(Vector2.ZERO));

    this.#camera.pos.assign(this.#camera.pos.add(worldDelta));
  }

  onScroll({ delta, ev }: Scroll) {
    if (this.game.isClient() && ev.target !== this.game.renderer.app.canvas) return;

    ev.preventDefault();

    if (ev.ctrlKey || ev.metaKey) {
      const zoomFactor = 1.1;
      const zoomDirection = delta.y > 0 ? 1 : -1;
      const newScale = this.#camera.globalTransform.scale.mul(
        Math.pow(zoomFactor, zoomDirection),
      );
      const clampedScale = new Vector2(Math.max(newScale.x, 0.1), Math.max(newScale.y, 0.1));
      this.#camera.globalTransform.scale = clampedScale;
    } else {
      const scale = 100;
      const deltaX = ev.shiftKey ? delta.y : delta.x;
      const deltaY = ev.shiftKey ? 0 : delta.y;
      const scrollDelta = new Vector2(deltaX, deltaY).mul(scale);

      const worldDelta = this.#camera
        .screenToWorld(scrollDelta)
        .sub(this.#camera.screenToWorld(Vector2.ZERO));

      this.#camera.pos.assign(this.#camera.pos.add(worldDelta));
    }
  }
}
