import RAPIER from "@dreamlab/vendor/rapier.ts";
import { Entity, EntityContext } from "../entity.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityPreUpdate, EntityUpdate, EntityDestroyed } from "../../signals/mod.ts";

export class Rigidbody2D extends Entity {
  public static readonly icon = "⚙️";

  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  #shape: RAPIER.Cuboid;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.body = this.game.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(this.globalTransform.position.x, this.globalTransform.position.y)
        .setRotation(this.globalTransform.rotation),
    );
    this.collider = this.game.physics.world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        this.globalTransform.scale.x / 2,
        this.globalTransform.scale.y / 2,
      ),
      this.body,
    );
    this.collider.setActiveCollisionTypes(
      RAPIER.ActiveCollisionTypes.DEFAULT | RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED,
    );
    this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    this.#shape = this.collider.shape as RAPIER.Cuboid;

    this.game.physics.registerBody(this, this.body);

    // EntityPreUpdate happens before physics runs, so we can set the physics body to match our transform
    this.on(EntityPreUpdate, () => {
      if (!this.game.physics.enabled) return;

      this.body.setTranslation(
        {
          x: this.globalTransform.position.x,
          y: this.globalTransform.position.y,
        },
        false,
      );
      this.body.setRotation(this.globalTransform.rotation, false);
      this.#shape.halfExtents = {
        x: this.globalTransform.scale.x / 2,
        y: this.globalTransform.scale.y / 2,
      };
    });

    // EntityUpdate happens after physics runs, so we can update our transform
    // to reflect the movement of the physics body
    this.on(EntityUpdate, () => {
      if (!this.game.physics.enabled) return;

      this.globalTransform.position = new Vector2(this.body.translation());
      this.globalTransform.rotation = this.body.rotation();
      this.globalTransform.scale = new Vector2(
        this.#shape.halfExtents.x * 2,
        this.#shape.halfExtents.y * 2,
      );
    });

    this.on(EntityDestroyed, () => {
      this.game.physics.world.removeRigidBody(this.body);
    });
  }
}
Entity.registerType(Rigidbody2D, "@core");
