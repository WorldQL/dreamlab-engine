import {
  ClickableRect,
  Entity,
  EntityContext,
  IVector2,
  PixiEntity,
  ValueChanged,
} from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugSquare } from "./_debug.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeClickableRect extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(ClickableRect, this);
  }

  static readonly icon = ClickableRect.icon;
  get bounds(): Readonly<IVector2> | undefined {
    return { x: this.width, y: this.height };
  }

  width: number = 1;
  height: number = 1;

  #debug: DebugSquare | undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValues(EditorFacadeClickableRect, "width", "height");
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug = new DebugSquare({ entity: this });

    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    this.listen(this.game.values, ValueChanged, ({ value }) => {
      if (this.#debug && (value === widthValue || value === heightValue)) {
        this.#debug.redraw();
      }
    });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<ClickableRect>, "clicked" | "hover">,
  EntityValueProps<EditorFacadeClickableRect>
>;
