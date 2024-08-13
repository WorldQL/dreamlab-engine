import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2 } from "../../../math/vector/vector2.ts";
import { EntityRenamed } from "../../../signals/mod.ts";
import { Entity, EntityContext } from "../../entity.ts";
import { PixiEntity } from "../../pixi-entity.ts";

export class EditorFakeCamera extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  // intentionally different to distinguish from real camera
  public static readonly icon = "📷";

  active: boolean = false;
  smooth: number = 0.01;

  #gfx: PIXI.Graphics | undefined;
  #text: PIXI.Text | undefined;

  #draw() {
    if (!this.#gfx) throw new Error("no graphics context");
    if (!this.#text) throw new Error("no text object");
    const bounds = this.#bounds;

    let text = this.name;
    if (this.active) text += "(active)";
    this.#text.text = text;
    this.#text.x = bounds.x / -2;
    this.#text.y = bounds.y / -2 - 0.33;

    this.#gfx
      .clear()
      .rect(bounds.x / -2, bounds.y / -2, bounds.x, bounds.y)
      .stroke({ color: "white", width: 0.02 });
  }

  #bounds: IVector2 = { x: 1, y: 1 };
  #updateBounds(bounds: IVector2) {
    // TODO: Return aspect ratio of current viewport
    this.#bounds.x = bounds.x;
    this.#bounds.y = bounds.y;

    if (this.#gfx && this.#text) this.#draw();
  }
  get bounds(): Readonly<IVector2> {
    return this.#bounds;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(EditorFakeCamera, "active", { replicated: false });
    this.defineValue(EditorFakeCamera, "smooth", { replicated: false });
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.#text = new PIXI.Text({
      style: {
        fontFamily: "Iosevka",
        fontSize: 120,
        fill: "white",
        align: "left",
      },
    });

    this.#text.scale.set(0.002);
    this.#draw();

    this.container.addChild(this.#text);
    this.container.addChild(this.#gfx);

    this.on(EntityRenamed, () => this.#draw());
  }
}
