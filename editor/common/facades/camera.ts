import {
  Camera,
  Entity,
  EntityContext,
  IVector2,
  PixiEntity,
  ValueChanged,
} from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugSquare, TemporaryCameraDebugDisplay } from "./_debug.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeCamera extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(Camera, this);
  }

  static readonly icon = Camera.icon;

  public smooth: number = 0.1;
  public unlocked: boolean = false;
  public active: boolean = false;

  // readonly bounds: Readonly<IVector2> = Object.freeze({
  //   x: Camera.TARGET_VIEWPORT_SIZE,
  //   y: Camera.TARGET_VIEWPORT_SIZE,
  // });

  readonly bounds: Readonly<IVector2> = Object.freeze({
    x: 0,
    y: 0,
  });

  // #debug: DebugSquare | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(EditorFacadeCamera, "active", "smooth", "unlocked");
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    // this.#debug = new TemporaryCameraDebugDisplay({ entity: this, suffix: this.active ? " (active)" : "" });

    // const activeValue = this.values.get("active");
    // this.listen(this.game.values, ValueChanged, ({ value }) => {
    //   if (this.#debug && value === activeValue) {
    //     this.#debug.suffix = this.active ? " (active)" : "";
    //   }
    // });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<Camera>, "container" | "smoothed">,
  EntityValueProps<EditorFacadeCamera>
>;
