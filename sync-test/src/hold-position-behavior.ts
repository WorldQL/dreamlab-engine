import { Behavior } from "@dreamlab/engine";

export default class HoldPosBehavior extends Behavior {
  x = 0.0;
  y = 0.0;

  onInitialize(): void {
    this.defineValues(HoldPosBehavior, "x", "y");

    if (this.game.isClient()) {
      this.game.renderer.app.canvas.addEventListener("mousedown", _ev => {
        const cursor = this.game.inputs.cursor;
        if (!cursor) return;
        this.x = cursor.world.x;
        this.y = cursor.world.y;
      });
    }
  }

  onTick(): void {
    this.entity.pos.x = this.x;
    this.entity.pos.y = this.y;
  }
}
