import {
  Bounds,
  childrenSorted,
  ComplexCollider,
  Entity,
  EntityChildDestroyed,
  EntityChildReparented,
  EntityChildSpawned,
  EntityContext,
  EntityDestroyed,
  EntityTransformUpdate,
  PixiEntity,
} from "@dreamlab/engine";
import {
  InitSelectedEntityService,
  SelectedEntityService,
} from "../../client/ui/selected-entity.ts";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugPolygon } from "./_debug.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeComplexCollider extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(ComplexCollider, this);
  }

  isSensor: boolean = false;
  mass: number = 1;

  static readonly icon = ComplexCollider.icon;

  #bounds: Bounds | undefined;
  get bounds(): Bounds | undefined {
    return this.#bounds;
  }

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValue(EditorFacadeComplexCollider, "isSensor", {
      description:
        "Marks the collider as a sensor, meaning it will detect collisions but not respond physically.",
    });

    this.defineValue(EditorFacadeComplexCollider, "mass", {
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
  #debug: DebugPolygon | undefined;
  #debugListener: { unsubscribe: () => void } | undefined;

  #getPoints = () =>
    childrenSorted(this)
      .filter(child => child.name !== "__EditorMetadata")
      .map(child => [child.transform.position.x, child.transform.position.y] as const);

  #update = () => {
    this.#debug?.redraw();
    this.#updateBounds();
  };

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.on(EntityDestroyed, () => {
      for (const child of this.children.values()) {
        child.unregister(EntityTransformUpdate, this.#update);
      }
    });

    this.#debug = new DebugPolygon({ entity: this, getPoints: this.#getPoints });

    for (const child of this.children.values()) {
      child.on(EntityTransformUpdate, this.#update);
    }

    this.on(EntityChildSpawned, ({ child }) => {
      child.on(EntityTransformUpdate, this.#update);
    });

    this.on(EntityChildDestroyed, this.#update);

    this.on(EntityChildReparented, ({ child, oldParent }) => {
      if (oldParent === this) child.unregister(EntityTransformUpdate, this.#update);
    });

    this.#update();
  }

  #updateBounds() {
    const points = this.#getPoints();
    if (points.length < 3) {
      this.#bounds = undefined;
      return;
    }

    this.#bounds = Bounds.fromPoints(points);
  }

  #onSelectedSvc(svc: SelectedEntityService) {
    this.#debugListener = svc.listen(selected => {
      let isSelected = false;
      for (const entity of selected) {
        if (entity === this) isSelected = true;
        if (entity.parent === this) isSelected = true;
      }

      this.#selected = isSelected;
      if (this.#debug) this.#debug.alwaysOnTop = this.#selected;
    });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<ComplexCollider>, "colliders">,
  EntityValueProps<EditorFacadeComplexCollider>
>;
