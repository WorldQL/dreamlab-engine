import {
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
  readonly bounds = undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValue(EditorFacadeComplexCollider, "isSensor");
    this.defineValue(EditorFacadeComplexCollider, "mass");

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

  #redraw = () => {
    this.#debug?.redraw();
  };

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    const getPoints = (): [number, number][] => {
      return [...this.children.values()]
        .filter(child => child.name !== "__EditorMetadata")
        .map(child => [child.transform.position.x, child.transform.position.y] as const);
    };

    this.on(EntityDestroyed, () => {
      for (const child of this.children.values()) {
        child.unregister(EntityTransformUpdate, this.#redraw);
      }
    });

    this.#debug = new DebugPolygon({ entity: this, getPoints });

    for (const child of this.children.values()) {
      child.on(EntityTransformUpdate, this.#redraw);
    }

    this.on(EntityChildSpawned, ({ child }) => {
      child.on(EntityTransformUpdate, this.#redraw);
    });

    this.on(EntityChildDestroyed, this.#redraw);

    this.on(EntityChildReparented, ({ child, oldParent }) => {
      if (oldParent === this) child.unregister(EntityTransformUpdate, this.#redraw);
    });
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
