import { Entity, EntityContext, IVector2, PixiEntity, RectCollider } from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugSquare } from "./_debug.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeRectCollider extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(RectCollider, this);
  }

  isSensor: boolean = false;

  static readonly icon = RectCollider.icon;
  get bounds(): Readonly<IVector2> | undefined {
    return { x: 1, y: 1 };
  }

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValues(EditorFacadeRectCollider, "isSensor");
  }

  #debug: DebugSquare | undefined;

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug = new DebugSquare({ entity: this });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<RectCollider>, "collider">,
  EntityValueProps<EditorFacadeRectCollider>
>;
