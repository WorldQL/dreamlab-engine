import { Entity, EntityContext, IVector2, PixiEntity, RectCollider2D } from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugSquare } from "./_debug.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeRectCollider2D extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(RectCollider2D, this);
  }

  isSensor: boolean = false;

  static readonly icon = RectCollider2D.icon;
  get bounds(): Readonly<IVector2> | undefined {
    return { x: 1, y: 1 };
  }

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(EditorFacadeRectCollider2D, "isSensor");
  }

  #debug: DebugSquare | undefined;

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug = new DebugSquare({ entity: this });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<RectCollider2D>, "collider">,
  EntityValueProps<EditorFacadeRectCollider2D>
>;
