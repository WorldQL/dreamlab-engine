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
    
    const transform = this.globalTransform;
    let updating = false;
  
    // Initialize zoom and aspect ratio
    this.zoom = 1 / transform.scale.x;
    let aspectRatio = transform.scale.y / transform.scale.x;
  
    const zoom = this.defineValue(EditorFacadeCamera, "zoom");
  
    const updateScaleFromZoom = () => {
      if (updating) return;
      updating = true;
      // Update scale.x and scale.y while preserving aspect ratio
      transform.scale.x = 1 / this.zoom;
      transform.scale.y = (1 / this.zoom) * aspectRatio;
      updating = false;
    };
  
    const updateZoomFromScale = () => {
      if (updating) return;
      updating = true;
      // Update zoom based on scale.x
      this.zoom = 1 / transform.scale.x;
      // Update aspect ratio
      aspectRatio = transform.scale.y / transform.scale.x;
      updating = false;
    };
  
    zoom.onChanged(updateScaleFromZoom);
  
    // Listen for changes in the scale to update zoom and aspect ratio
    this.on(EntityTransformUpdate, updateZoomFromScale);
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
