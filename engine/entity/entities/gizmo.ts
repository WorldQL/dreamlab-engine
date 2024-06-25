import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { GameRender } from "../../signals/mod.ts";
import type { EntityContext } from "../entity.ts";
import { Entity } from "../entity.ts";

export class Gizmo extends Entity {
  public static readonly icon = "➡️";

  static #X_COLOR = "red";
  static #Y_COLOR = "green";
  static #Z_COLOR = "blue";
  static #NEUTRAL_COLOR = "gray";

  static #ARROW_W = 0.1;
  static #ARROW_H = 0.15;
  static #SCALE_S = 0.15;

  static #translateCtx = new PIXI.GraphicsContext()
    .moveTo(0, 0)
    .lineTo(1, 0)
    .stroke({ color: Gizmo.#X_COLOR, width: 0.02 })
    .moveTo(0, 0)
    .lineTo(0, -1)
    .stroke({ color: Gizmo.#Y_COLOR, width: 0.02 })
    .moveTo(0.2, 0.2)
    .rect(0.1, -0.4, 0.3, 0.3)
    .fill({ alpha: 0.2, color: Gizmo.#Z_COLOR })
    .stroke({ alpha: 0.5, color: Gizmo.#Z_COLOR, width: 0.01 })
    .poly([1, Gizmo.#ARROW_W / 2, 1, -Gizmo.#ARROW_W / 2, 1 + Gizmo.#ARROW_H, 0])
    .fill(Gizmo.#X_COLOR)
    .poly([Gizmo.#ARROW_W / 2, -1, -Gizmo.#ARROW_W / 2, -1, 0, -1 - Gizmo.#ARROW_H])
    .fill(Gizmo.#Y_COLOR);

  static #rotateCtx = new PIXI.GraphicsContext()
    .moveTo(-1, 0)
    .lineTo(1, 0)
    .stroke({ color: Gizmo.#X_COLOR, width: 0.02, alpha: 0.6 })
    .moveTo(0, 1)
    .lineTo(0, -1)
    .stroke({ color: Gizmo.#Y_COLOR, width: 0.02, alpha: 0.6 })
    .scale(0.1)
    .circle(0, 0, 10)
    .stroke({ color: Gizmo.#NEUTRAL_COLOR, width: 0.02 });

  static #scaleCtx = new PIXI.GraphicsContext()
    .moveTo(0, 0)
    .lineTo(1, 0)
    .stroke({ color: Gizmo.#X_COLOR, width: 0.02 })
    .moveTo(0, 0)
    .lineTo(0, -1)
    .stroke({ color: Gizmo.#Y_COLOR, width: 0.02 })
    .moveTo(0.2, 0.2)
    .rect(1, -Gizmo.#SCALE_S / 2, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#X_COLOR)
    .rect(-Gizmo.#SCALE_S / 2, -1 - Gizmo.#SCALE_S, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#Y_COLOR)
    .rect(0.1, -0.4, 0.3, 0.3)
    .fill({ alpha: 0.2, color: Gizmo.#Z_COLOR })
    .stroke({ alpha: 0.5, color: Gizmo.#Z_COLOR, width: 0.01 });

  static #combinedCtx = new PIXI.GraphicsContext()
    // Lines
    .moveTo(0, 0)
    .lineTo(0.7, 0)
    .stroke({ color: Gizmo.#X_COLOR, width: 0.02 })
    .moveTo(0, 0)
    .lineTo(0, -0.7)
    .stroke({ color: Gizmo.#Y_COLOR, width: 0.02 })
    // Scale handles
    .rect(0.7, -Gizmo.#SCALE_S / 2, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#X_COLOR)
    .rect(-Gizmo.#SCALE_S / 2, -0.7 - Gizmo.#SCALE_S, Gizmo.#SCALE_S, Gizmo.#SCALE_S)
    .fill(Gizmo.#Y_COLOR)
    // Move handles
    .poly([1.1, Gizmo.#ARROW_W / 2, 1.1, -Gizmo.#ARROW_W / 2, 1.1 + Gizmo.#ARROW_H, 0])
    .fill(Gizmo.#X_COLOR)
    .poly([Gizmo.#ARROW_W / 2, -1.1, -Gizmo.#ARROW_W / 2, -1.1, 0, -1.1 - Gizmo.#ARROW_H])
    .fill(Gizmo.#Y_COLOR)
    // Rotation circle
    .scale(0.1)
    .circle(0, 0, 10)
    .stroke({ color: Gizmo.#NEUTRAL_COLOR, width: 0.02 });

  #graphics: PIXI.Graphics | undefined;

  #mode: "translate" | "rotate" | "scale" | "combined" = "translate";
  get #ctx() {
    if (this.mode === "translate") return Gizmo.#translateCtx;
    else if (this.mode === "rotate") return Gizmo.#rotateCtx;
    else if (this.mode === "scale") return Gizmo.#scaleCtx;
    else if (this.mode === "combined") return Gizmo.#combinedCtx;
    else throw new Error("invalid mode");
  }

  get mode() {
    return this.#mode;
  }
  set mode(value) {
    this.#mode = value;
    if (this.#graphics) this.#graphics.context = this.#ctx;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.listen(this.game, GameRender, () => {
      if (!this.#graphics) return;

      const pos = this.globalTransform.position;
      const rotation = this.globalTransform.rotation;

      this.#graphics.position = { x: pos.x, y: -pos.y };
      this.#graphics.rotation = -rotation;

      // const camera = Camera.getActive(this.game);
      // if (camera) {
      //   this.#graphics.scale = camera.smoothed.scale;
      // } else {
      //   this.#graphics.scale = 1;
      // }
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    this.#graphics = new PIXI.Graphics(this.#ctx);
    this.game.renderer.scene.addChild(this.#graphics);
  }

  destroy(): void {
    super.destroy();
    this.#graphics?.destroy();
  }
}
Entity.registerType(Gizmo, "@core");
