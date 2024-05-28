import { Entity, EntityContext, RenderTime } from "../entity/mod.ts";
import { Color, Graphics } from "../_deps/pixi.ts";

export class PhysicsDebug extends Entity {
  public enabled = this.values.boolean({
    name: "enabled",
    default: true,
    local: true,
  });

  private toggle = this.inputs.create(
    "@physics-debug/toggle",
    "Toggle Physics Debug Overlay",
    "KeyP",
  );

  #onPressed = () => {
    this.enabled.value = !this.enabled.value;
  };

  private graphics: Graphics[] = [];

  public constructor(ctx: EntityContext) {
    super(ctx);

    this.toggle.on("pressed", this.#onPressed);
  }

  public destroy(): void {
    this.toggle.off("pressed", this.#onPressed);
  }

  public onRender({ game }: RenderTime): void {
    if (!this.enabled.value) {
      this.graphics.forEach((gfx) => gfx.destroy());
      this.graphics = [];

      return;
    }

    // TODO: Re-use graphics objects
    this.graphics.forEach((gfx) => gfx.destroy());
    this.graphics = [];

    const { vertices, colors } = this.game.physics.debugRender();
    const vtx = vertices;

    for (let i = 0; i < vtx.length / 4; i += 1) {
      const x1 = vtx[i * 4 + 0];
      const y1 = vtx[i * 4 + 1];
      const x2 = vtx[i * 4 + 2];
      const y2 = vtx[i * 4 + 3];

      if (
        x1 === undefined || y1 === undefined || x2 === undefined ||
        y2 === undefined
      ) {
        console.warn("invalid vertex buffer");
        continue;
      }

      const r = colors[i * 4 + 0];
      const g = colors[i * 4 + 1];
      const b = colors[i * 4 + 2];
      const a = colors[i * 4 + 3];

      if (
        r === undefined || g === undefined || b === undefined || a === undefined
      ) {
        console.warn("invalid colour buffer");
        continue;
      }

      const gfx = new Graphics();
      const color = new Color({
        r: r * 255,
        g: g * 255,
        b: b * 255,
        a: a * 255,
      });

      const start = game.camera.worldToScreen({ x: x1, y: y1 });
      const end = game.camera.worldToScreen({ x: x2, y: y2 });

      gfx.lineStyle(1, color, 1);
      gfx.moveTo(start.x, start.y);
      gfx.lineTo(end.x, end.y);
      gfx.closePath();

      this.graphics.push(gfx);
      game.app.stage.addChild(gfx);
    }
  }
}
