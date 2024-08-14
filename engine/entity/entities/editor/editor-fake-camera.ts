import { IVector2 } from "../../../math/mod.ts";
import { ValueChanged } from "../../../value/mod.ts";
import { Entity, EntityContext } from "../../entity.ts";
import { PixiEntity } from "../../pixi-entity.ts";
import { Camera } from "../camera.ts";
import { DebugSquare } from "./_debug.ts";

export class EditorFakeCamera extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "🎥";
  readonly bounds: Readonly<IVector2> = Object.freeze({
    x: Camera.TARGET_VIEWPORT_SIZE,
    y: Camera.TARGET_VIEWPORT_SIZE,
  });

  active: boolean = false;
  smooth: number = 0.01;
  unlocked: boolean = false;

  #debug: DebugSquare | undefined;
  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(EditorFakeCamera, "active", { replicated: false });
    this.defineValue(EditorFakeCamera, "smooth", { replicated: false });
    this.defineValue(EditorFakeCamera, "unlocked", { replicated: false });
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug = new DebugSquare({ entity: this, suffix: this.active ? " (active)" : "" });

    const activeValue = this.values.get("active");
    this.listen(this.game.values, ValueChanged, ({ value }) => {
      if (this.#debug && value === activeValue) {
        this.#debug.suffix = this.active ? " (active)" : "";
      }
    });
  }
}
