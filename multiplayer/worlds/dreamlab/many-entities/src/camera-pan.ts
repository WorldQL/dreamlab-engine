import {
  Behavior,
  Camera,
  MouseDown,
  MouseMove,
  MouseUp,
  Scroll,
  Vector2,
} from "@dreamlab/engine";

export default class CameraPanBehavior extends Behavior {
  #camera = this.entity.cast(Camera);
  #drag: Vector2 | undefined = undefined;

  onInitialize(): void {
    if (!this.game.isClient()) return;
    this.listen(this.game.inputs, MouseDown, this.onMouseDown);
    this.listen(this.game.inputs, MouseMove, this.onMouseMove);
    this.listen(this.game.inputs, MouseUp, this.onMouseUp);
    this.listen(this.game.inputs, Scroll, this.onScroll);
  }

  onMouseDown(event: MouseDown) {
    if (!this.game.isClient()) return;
    if (event.button === "left") {
      this.#drag = event.cursor.screen.clone();
    }
  }

  onMouseUp(event: MouseUp) {
    if (!this.game.isClient()) return;
    if (event.button === "left" && this.#drag) this.#drag = undefined;
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
      const zoomFactor = ev.altKey ? 2.25 : 1.65;
      const zoomDirection = delta.y > 1 ? 1 : delta.y < -1 ? -1 : delta.y;
      const newScale = this.#camera.globalTransform.scale.mul(
        Math.pow(zoomFactor, zoomDirection),
      );

      const clampedScale = new Vector2(Math.max(newScale.x, 0.1), Math.max(newScale.y, 0.1));
      this.#camera.globalTransform.scale = clampedScale;

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
