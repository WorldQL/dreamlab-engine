import {
  AspectRatioAdapter,
  Camera,
  Entity,
  EntityContext,
  EntityDestroyed,
  enumAdapter,
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

type ScaleFilterMode = enumAdapter.Union<typeof ScaleFilterModeAdapter>;
const ScaleFilterModeAdapter = enumAdapter(["linear", "nearest"]);

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
  public zoom: number = 1;
  public showBounds: boolean = false;
  public lockAspectRatio: boolean = false;
  public aspectRatio: readonly [number, number] = [1, 1];
  public scaleFilterMode: ScaleFilterMode = "nearest";

  #selected: boolean = false;
  #updateShowBounds() {
    if (!this.#debug) return;
    this.#debug.enabled = this.#selected || this.showBounds;
  }

  #debug: DebugSquare | undefined;
  #debugListener: { unsubscribe: () => void } | undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValue(EditorFacadeCamera, "showBounds", {
      replicated: false,
      persistent: false,
    });

    this.defineValues(
      EditorFacadeCamera,
      "active",
      "smooth",
      "unlocked",
      "zoom",
      "lockAspectRatio",
    );
    this.defineValue(EditorFacadeCamera, "aspectRatio", {
      type: AspectRatioAdapter,
      hidden: values => values.get("lockAspectRatio")?.value === false,
    });
    this.defineValue(EditorFacadeCamera, "scaleFilterMode", { type: ScaleFilterModeAdapter });

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
      disableScale: true,
      suffix: this.active ? " (active)" : "",
      getBounds: () => {
        const vec = Vector2.splat(Camera.TARGET_VIEWPORT_SIZE).div(this.zoom);
        const [w, h] = this.aspectRatio;
        const r = w / h;

        if (!this.lockAspectRatio || (w === 1 && h === 1) || r === 1) {
          return { width: vec.x, height: vec.y };
        }

        if (w / h > 1) {
          // wide
          vec.x *= w / h;
          return { width: vec.x, height: vec.y };
        } else {
          // tall
          vec.y /= w / h;
          return { width: vec.x, height: vec.y };
        }
      },
    });
    this.#debug.alwaysOnTop = true;

    const showBounds = this.values.get("showBounds");
    showBounds?.onChanged(() => {
      this.#updateShowBounds();
    });

    const zoom = this.values.get("zoom");
    zoom?.onChanged(() => {
      this.#debug?.redraw();
    });

    const lockAspectRatio = this.values.get("lockAspectRatio");
    lockAspectRatio?.onChanged(() => {
      this.#debug?.redraw();
    });

    const aspectRatio = this.values.get("aspectRatio");
    aspectRatio?.onChanged(() => {
      this.#debug?.redraw();
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
      this.#selected = selected.includes(this);
      this.#updateShowBounds();
    });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<Camera>, "container" | "smoothed">,
  EntityValueProps<EditorFacadeCamera>
>;
