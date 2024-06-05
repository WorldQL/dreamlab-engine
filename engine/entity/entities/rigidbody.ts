import RAPIER from "../../_deps/rapier.ts";
import { Entity, EntityContext } from "../entity.ts";
import { Vector2 } from "../../math.ts";
import { EntityPreUpdate, EntityUpdate } from "../../signals/entity-updates.ts";

export class Rigidbody2D extends Entity {
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  #shape: RAPIER.Cuboid;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.body = this.game.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(
          this.globalTransform.position.x,
          this.globalTransform.position.y
        )
        .setRotation(this.globalTransform.rotation)
    );
    this.collider = this.game.physics.world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        this.globalTransform.scale.x / 2,
        this.globalTransform.scale.y / 2
      ),
      this.body
    );
    this.#shape = this.collider.shape as RAPIER.Cuboid;

    this.game.physics.registerBody(this, this.body);

    // EntityPreUpdate happens before physics runs, so we can set the physics body to match our transform
    this.on(EntityPreUpdate, () => {
      this.body.setTranslation(
        {
          x: this.globalTransform.position.x,
          y: this.globalTransform.position.y,
        },
        false
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
      this.globalTransform.position = new Vector2(this.body.translation());
      this.globalTransform.rotation = this.body.rotation();
      this.globalTransform.scale = new Vector2(
        this.#shape.halfExtents.x * 2,
        this.#shape.halfExtents.y * 2
      );
    });
  }
}
Entity.registerType(Rigidbody2D, "@core");
