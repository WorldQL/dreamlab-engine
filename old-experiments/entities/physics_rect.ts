import RAPIER from "../_deps/rapier_2d.ts";
import { Entity, EntityContext, Time } from "../entity/mod.ts";

export class PhysicsRect extends Entity {
  public width = this.values.number({ name: "width", default: 1 });
  public height = this.values.number({ name: "height", default: 1 });

  protected readonly body: RAPIER.RigidBody;
  protected readonly collider: RAPIER.Collider;

  public constructor(ctx: EntityContext) {
    super(ctx);

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        this.transform.translation.x,
        this.transform.translation.y,
      )
      .setRotation(this.transform.rotation);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      this.width.value / 2,
      this.height.value / 2,
    );

    this.body = this.game.physics.createRigidBody(bodyDesc);
    this.collider = this.game.physics.createCollider(colliderDesc, this.body);

    this.transform.translation.on("changed", (value) => {
      const current = this.body.translation();
      if (current.x === value.x && current.y === value.y) return;

      this.body.setTranslation(value, true);
    });

    this.transform.on("rotation", (value) => {
      const current = this.body.rotation();
      if (current === value) return;

      this.body.setRotation(value, true);
    });
  }

  public destroy(): void {
    this.game.physics.removeRigidBody(this.body);
  }

  public onTick(_: Time): void {
    this.transform.rotation = this.body.rotation();
    this.transform.translation = {
      ...this.body.translation(),
      z: this.transform.translation.z,
    };
  }
}
