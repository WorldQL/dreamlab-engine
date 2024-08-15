import {
  Behavior,
  Camera,
  Gizmo,
  MouseDown,
  MouseMove,
  MouseUp,
  Scroll,
  Vector2,
} from "@dreamlab/engine";
import { InspectorUI } from "./inspector/inspector.ts";

export class CameraPanBehavior extends Behavior {
  ui: InspectorUI | undefined;

  #camera = this.entity.cast(Camera);
  #drag: Vector2 | undefined = undefined;

  onInitialize(): void {
    if (!this.game.isClient()) return;
    this.listen(this.game.inputs, MouseDown, this.onMouseDown.bind(this));
    this.listen(this.game.inputs, MouseMove, this.onMouseMove.bind(this));
    this.listen(this.game.inputs, MouseUp, this.onMouseUp.bind(this));
    this.listen(this.game.inputs, Scroll, this.onScroll.bind(this));
  }

  onMouseDown(event: MouseDown) {
    if (!this.game.isClient()) return;
    if (event.button !== "middle") return;
    this.#drag = event.cursor.screen.clone();
  }

  onMouseUp(event: MouseUp) {
    if (!this.game.isClient()) return;

    if (this.#drag) this.#drag = undefined;

    if (!this.#drag && event.button === "left" && event.cursor.world) {
      const gizmo = this.game.local?.children.get("Gizmo")?.cast(Gizmo);
      if (!gizmo) return;

      const entities = this.game.entities
        .lookupByPosition(event.cursor.world)
        .filter(entity => this.ui?.sceneGraph?.entryElementMap?.has(entity.ref) ?? true)
        .toSorted((a, b) => a.z - b.z);

      const entity = entities.at(0);
      gizmo.target = entity;
      if (this.ui) this.ui.selectedEntity.entities = entity ? [entity] : [];
    }
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
    ev.preventDefault();

    if (!ev.ctrlKey) {
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
