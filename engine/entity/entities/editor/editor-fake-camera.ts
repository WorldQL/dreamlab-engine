import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Vector2 } from "../../../math/mod.ts";
import { EntityRenamed, EntityResize } from "../../../signals/mod.ts";
import { ValueChanged } from "../../../value/mod.ts";
import { Entity, EntityContext } from "../../entity.ts";
import { PixiEntity } from "../../pixi-entity.ts";
import { Camera } from "../camera.ts";
import { createLabel, Label } from "./_label.ts";

export class EditorFakeCamera extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  // intentionally different to distinguish from real camera
  public static readonly icon = "📷";
  readonly bounds: Readonly<IVector2> = Object.freeze({
    x: Camera.TARGET_VIEWPORT_SIZE,
    y: Camera.TARGET_VIEWPORT_SIZE,
  });

  active: boolean = false;
  smooth: number = 0.01;
  unlocked: boolean = false;

  #gfx: PIXI.Graphics | undefined;
  #label: Label | undefined;

  #draw() {
    if (!this.#gfx) throw new Error("no graphics context");
    if (!this.#label) throw new Error("no label object");

    const bounds = Vector2.mul(this.bounds, this.globalTransform.scale);
    this.#label.container.x = bounds.x / -2 - 0.05;
    this.#label.container.y = bounds.y / -2 - 0.36;

    const color: PIXI.ColorSource = 0xffffff;
    const alpha = 0.8;
    const width: number = 0.02;

    this.#label.container.alpha = alpha;
    this.#gfx.alpha = alpha;

    this.#gfx
      .clear()
      .rect(bounds.x / -2, bounds.y / -2, bounds.x, bounds.y)
      .stroke({ color, width, alignment: -1 })
      .moveTo(bounds.x / -2 - width, bounds.y / -2 - width)
      .lineTo(bounds.x / 2 + width, bounds.y / 2 + width)
      .moveTo(bounds.x / -2 - width, bounds.y / 2 + width)
      .lineTo(bounds.x / 2 + width, bounds.y / -2 - width)
      .stroke({ color, width });
  }

  #updateText() {
    if (!this.#label) throw new Error("no label object");

    let text = this.name;
    if (this.active) text += " (active)";
    this.#label.text.text = text;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(EditorFakeCamera, "active", { replicated: false });
    this.defineValue(EditorFakeCamera, "smooth", { replicated: false });
    this.defineValue(EditorFakeCamera, "unlocked", { replicated: false });
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.#label = createLabel(EditorFakeCamera.icon);

    this.#draw();
    this.#updateText();

    this.container.addChild(this.#label.container);
    this.container.addChild(this.#gfx);

    this.on(EntityResize, () => this.#draw());
    this.on(EntityRenamed, () => this.#updateText());

    const activeValue = this.values.get("active");
    this.listen(this.game.values, ValueChanged, ({ value }) => {
      if (value === activeValue) this.#updateText();
    });
  }
}
