import {
  Bounds,
  Click,
  Entity,
  EntityContext,
  JsonValue,
  PersistedEntity,
  PixiEntity,
  defineSyncedObject,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Facades } from "./manager.ts";

export class PersistedEntityFacade extends PixiEntity {
  static readonly icon: string = PersistedEntity.icon;

  static {
    Entity.registerType(this, "@editor");
    Facades.register(PersistedEntity, this);
  }

  readonly bounds: Bounds = Bounds.ONE;

  constructor(ctx: EntityContext) {
    super(ctx);
    defineSyncedObject(this, "synced", ctx.sync ?? {});
  }

  onInitialize() {
    super.onInitialize();

    if (!this.container) return;

    const gfx = new PIXI.Graphics();
    gfx.rect(-0.5, -0.5, 1, 1).fill("white");
    this.container.addChild(gfx);

    this.listen(this.game.inputs, Click, ({ cursor }) => {
      const inBounds = this.game.entities.lookupByPosition(cursor.world).includes(this);
      if (!inBounds) return;

      this.synced.clicked += 1;
    });
  }

  readonly synced = { clicked: 0 };

  protected saveDataForScene(): JsonValue | undefined {
    // persist to project.json
    // you may apply any kind of transform for efficient packing
    return this.synced;
  }

  protected loadDataForScene(value: JsonValue | undefined): void {
    // receive the saved json value and assign back to synced object
    // undo any transforms here
    Object.assign(this.synced, value);
  }
}
