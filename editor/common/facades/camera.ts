import {
  Camera,
  Entity,
  EntityContext,
  EntityTransformUpdate,
  IVector2,
  PixiEntity,
  Vector2,
} from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
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

  public zoom: number;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValues(EditorFacadeCamera, "active", "smooth", "unlocked");

    this.zoom = 1 / this.globalTransform.scale.x;
    const zoom = this.defineValue(EditorFacadeCamera, "zoom");
    let zoomChanging = false;
    zoom.onChanged(() => {
      zoomChanging = true;
      this.globalTransform.scale = Vector2.ONE.mul(1 / this.zoom);
      zoomChanging = false;
    });
    this.on(EntityTransformUpdate, () => {
      if (zoomChanging) return;
      this.zoom = 1 / this.globalTransform.scale.x;
    });
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    // this.#debug = new TemporaryCameraDebugDisplay({ entity: this, suffix: this.active ? " (active)" : "" });

    // const activeValue = this.values.get("active");
    // activeValue?.onChanged(() => {
    //  if (this.#debug) {
    //    this.#debug.suffix = this.active ? " (active)" : "";
    //  }
    // });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<Camera>, "container" | "smoothed">,
  EntityValueProps<EditorFacadeCamera>
>;
