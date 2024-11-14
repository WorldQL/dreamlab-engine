import {
  Camera,
  Entity,
  EntityContext,
  EntityDestroyed,
  EntityTransformUpdate,
  PixiEntity,
  Vector2,
} from "@dreamlab/engine";
import {
  InitSelectedEntityService,
  SelectedEntityService,
} from "../../client/ui/selected-entity.ts";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugSquare } from "./_debug.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeCamera extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(Camera, this);
  }

  static readonly icon = Camera.icon;
  readonly bounds: undefined;

  public smooth: number = 0.1;
  public unlocked: boolean = false;
  public active: boolean = false;
  public zoom: number;

  #debug: DebugSquare | undefined;
  #debugListener: { unsubscribe: () => void } | undefined;

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

    if (this.game.isClient()) {
      const svc = SelectedEntityService.serviceForGame(this.game);
      if (svc) {
        this.#onSelectedSvc(svc);
      } else {
        this.listen(this.game, InitSelectedEntityService, ({ svc }) => {
          this.#onSelectedSvc(svc);
        });
      }
    }

    this.on(EntityDestroyed, () => {
      this.#debugListener?.unsubscribe();
    });
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug = new DebugSquare({
      entity: this,
      enabled: false,
      width: 0.04,
      suffix: this.active ? " (active)" : "",
      getBounds: () => Vector2.splat(Camera.TARGET_VIEWPORT_SIZE),
    });

    const activeValue = this.values.get("active");
    activeValue?.onChanged(() => {
      if (this.#debug) {
        this.#debug.suffix = this.active ? " (active)" : "";
      }
    });
  }

  #onSelectedSvc(svc: SelectedEntityService) {
    this.#debugListener = svc.listen(selected => {
      if (!this.#debug) return;
      this.#debug.enabled = selected.includes(this);
    });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<Camera>, "container" | "smoothed">,
  EntityValueProps<EditorFacadeCamera>
>;
