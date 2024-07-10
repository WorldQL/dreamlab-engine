import RAPIER from "@dreamlab/vendor/rapier.ts";
import { Entity, EntityContext } from "../entity.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityPreUpdate, EntityUpdate, EntityDestroyed } from "../../signals/mod.ts";
import { enumAdapter } from "../../value/adapters/enum-adapter.ts";

type RigidBodyType = (typeof rigidbodyTypes)[number];
const rigidbodyTypes = [
  "dynamic",
  "fixed",
  // "kinematic-position",
  // "kinematic-velocity",
  // TODO: Implement these nicely
] as const;

const RigidbodyTypeAdapter = enumAdapter(rigidbodyTypes);

export class Rigidbody2D extends Entity {
  public static readonly icon = "⚙️";

  type: RigidBodyType = "fixed";

  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  #shape: RAPIER.Cuboid;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.value(Rigidbody2D, "type", { type: RigidbodyTypeAdapter });

    let desc: RAPIER.RigidBodyDesc;
    if (this.type === "dynamic") desc = RAPIER.RigidBodyDesc.dynamic();
    else if (this.type === "fixed") desc = RAPIER.RigidBodyDesc.fixed();
    else if (this.type === "kinematic-position")
      desc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    else if (this.type === "kinematic-velocity")
      desc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
    else throw new Error("invalid rigidbody type");

    desc = desc
      .setTranslation(this.globalTransform.position.x, this.globalTransform.position.y)
      .setRotation(this.globalTransform.rotation);

    this.body = this.game.physics.world.createRigidBody(desc);
    this.collider = this.game.physics.world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        this.globalTransform.scale.x / 2,
        this.globalTransform.scale.y / 2,
      ),
      this.body,
    );
    this.collider.setActiveCollisionTypes(
      RAPIER.ActiveCollisionTypes.DEFAULT |
        RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED |
        RAPIER.ActiveCollisionTypes.FIXED_FIXED,
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
