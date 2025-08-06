import {
  Bounds,
  Entity,
  EntityContext,
  IBounds,
  PixiEntity,
  RectCollider,
} from "@dreamlab/engine";
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
  readonly bounds: IBounds = Bounds.ONE;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValue(EditorFacadeRectCollider, "isSensor", {
      description:
        "Indicates whether the collider acts as a sensor, detecting collisions without physical response.",
    });
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
