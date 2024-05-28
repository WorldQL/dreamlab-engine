import RAPIER from "../_deps/rapier_2d.ts";
import { Entity, EntityContext } from "../entity/mod.ts";

export class ColliderRect extends Entity {
  public width = this.values.number({ name: "width", default: 1 });
  public height = this.values.number({ name: "height", default: 1 });

  protected readonly collider: RAPIER.Collider;

  public constructor(ctx: EntityContext) {
    super(ctx);

    const transform = this.transform;
    const desc = RAPIER.ColliderDesc
      .cuboid(this.width.value / 2, this.height.value / 2)
      .setTranslation(transform.translation.x, transform.translation.y)
      .setRotation(transform.rotation);

    this.collider = this.game.physics.createCollider(desc);
  }

  public destroy(): void {
    this.game.physics.removeCollider(this.collider, false);
  }
}
