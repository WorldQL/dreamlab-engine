import {
  Camera,
  Entity,
  EntityContext,
  PixiEntity,
  ValueChanged,
  IVector2,
} from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugSquare } from "./_debug.ts";

export class EditorFacadeCamera extends PixiEntity {
  static readonly icon = "📷";

  public smooth: number = 0.1;
  public unlocked: boolean = false;
  public active: boolean = false;

  readonly bounds: Readonly<IVector2> = Object.freeze({
    x: Camera.TARGET_VIEWPORT_SIZE,
    y: Camera.TARGET_VIEWPORT_SIZE,
  });

  #debug: DebugSquare | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(EditorFacadeCamera, "active", "smooth", "unlocked");
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
Entity.registerType(EditorFacadeCamera, "@editor");

type _HasAllCameraValues = EnsureCompatible<
  Omit<EntityValueProps<Camera>, "container" | "smoothed">,
  EntityValueProps<EditorFacadeCamera>
>;
