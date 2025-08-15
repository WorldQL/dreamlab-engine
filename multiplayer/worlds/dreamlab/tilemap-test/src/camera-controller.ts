import {
  Behavior,
  Camera,
  EntityDestroyed,
  MouseDown,
  MouseUp,
  Scroll,
  syncedValue,
  Vector2,
} from "@dreamlab/engine";

export default class CameraController extends Behavior {
  #camera = this.entity.cast(Camera);
  #isPanning = false;
  #lastCursorWorldPosition = Vector2.ZERO;
  #zoomSpeed = 0.1;

  @syncedValue()
  minZoom = 0.25;

  @syncedValue()
  maxZoom = 3.0;

  onInitialize(): void {
    if (!this.game.isClient()) return;

    this.listen(this.inputs, MouseDown, this.#onMouseDown);
    this.listen(this.inputs, MouseUp, this.#onMouseUp);
    this.listen(this.inputs, Scroll, this.#onScroll);

    const controller = new AbortController();
    const signal = controller.signal;

    // Prevent context menu on right click
    document.addEventListener("contextmenu", e => e.preventDefault(), { signal });

    this.listen(this.entity, EntityDestroyed, () => {
      if (!this.game.isClient()) return;
      controller.abort();
    });
  }

  #onMouseDown = ({ button, ev }: MouseDown): void => {
    if (button === "middle") {
      // Middle mouse button
      this.#isPanning = true;
      const cursorWorldPos = this.inputs.cursor.world;
      if (cursorWorldPos) {
        this.#lastCursorWorldPosition = cursorWorldPos.clone();
      }
      ev.preventDefault();
    }
  };

  #onMouseUp = ({ button, ev }: MouseUp): void => {
    if (button === "middle") {
      // Middle mouse button
      this.#isPanning = false;
      ev.preventDefault();
    }
  };

  #onScroll = ({ delta, ev }: Scroll): void => {
    const zoomFactor = delta.y > 0 ? 1 - this.#zoomSpeed : 1 + this.#zoomSpeed;

    const currentZoom = this.#camera.zoom;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, currentZoom * zoomFactor));

    this.#camera.zoom = newZoom;

    ev.preventDefault();
  };

  onTick(): void {
    if (this.#isPanning) {
      const currentCursorWorldPos = this.inputs.cursor.world;
      if (currentCursorWorldPos) {
        const worldDelta = this.#lastCursorWorldPosition.sub(currentCursorWorldPos);

        this.#camera.transform.position = this.#camera.transform.position.add(worldDelta);

        // Update the last cursor position to account for the camera's new position
        const newCursorWorldPos = this.inputs.cursor.world;
        if (newCursorWorldPos) {
          this.#lastCursorWorldPosition = newCursorWorldPos.clone();
        }
      }
    }
  }
}
