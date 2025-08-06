import {
  Bounds,
  Collider,
  Entity,
  EntityContext,
  EntityDestroyed,
  enumAdapter,
  PixiEntity,
} from "@dreamlab/engine";
import {
  InitSelectedEntityService,
  SelectedEntityService,
} from "../../client/ui/selected-entity.ts";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugCapsule, DebugCircle, DebugSquare } from "./_debug.ts";
import { Facades } from "./manager.ts";

type ColliderShape = enumAdapter.Union<typeof ColliderShapeAdapter>;
const ColliderShapeAdapter = enumAdapter(["Rectangle", "Circle" /*, "Capsule" */]);

export class EditorFacadeCollider extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(Collider, this);
  }

  isSensor: boolean = false;
  shape: ColliderShape = "Rectangle";
  mass: number = 1;

  static readonly icon = Collider.icon;
  readonly bounds = Bounds.ONE;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValue(EditorFacadeCollider, "isSensor", {
      description:
        "Marks the collider as a sensor, meaning it will detect collisions but not respond physically.",
    });

    this.defineValue(EditorFacadeCollider, "shape", {
      type: ColliderShapeAdapter,
      description: "Defines the shape of the collider. Options include Rectangle and Circle.",
    });

    this.defineValue(EditorFacadeCollider, "mass", {
      description: "Sets the mass of the collider, affecting its physical interactions.",
    });

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

  #selected: boolean = false;
  #debug: DebugSquare | DebugCircle | DebugCapsule | undefined;
  #debugListener: { unsubscribe: () => void } | undefined;

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug = this.createDebugShape();

    const shapeValue = this.values.get("shape");
    shapeValue?.onChanged(() => this.onShapeChanged());
  }

  onShapeChanged(): void {
    if (!this.container) return;

    if (this.#debug) {
      this.#debug.destroy();
      this.#debug = undefined;
    }

    this.#debug = this.createDebugShape();
  }

  private createDebugShape(): DebugSquare | DebugCircle | DebugCapsule {
    return this.shape === "Rectangle"
      ? new DebugSquare({ entity: this })
      : this.shape === "Circle"
        ? new DebugCircle({ entity: this })
        : new DebugCapsule({ entity: this });
  }

  #onSelectedSvc(svc: SelectedEntityService) {
    this.#debugListener = svc.listen(selected => {
      this.#selected = selected.includes(this);
      if (this.#debug) this.#debug.alwaysOnTop = this.#selected;
    });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<Collider>, "collider">,
  EntityValueProps<EditorFacadeCollider>
>;
