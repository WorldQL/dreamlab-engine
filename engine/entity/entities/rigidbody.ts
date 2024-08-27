import RAPIER from "@dreamlab/vendor/rapier.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { EntityDestroyed, EntityPreUpdate, EntityUpdate } from "../../signals/mod.ts";
import { enumAdapter } from "../../value/adapters/enum-adapter.ts";
import { ValueChanged } from "../../value/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

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
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "⚙️";
  get bounds(): Readonly<IVector2> | undefined {
    // controlled by globalTransform
    return { x: 1, y: 1 };
  }

  type: RigidBodyType = "fixed";

  #internal:
    | { body: RAPIER.RigidBody; collider: RAPIER.Collider; shape: RAPIER.Cuboid }
    | undefined;

  get body(): RAPIER.RigidBody {
    if (!this.#internal) throw new Error("attempted to access .body on a prefab object");
    return this.#internal.body;
  }

  get collider(): RAPIER.Collider {
    if (!this.#internal) throw new Error("attempted to access .collider on a prefab object");
    return this.#internal.collider;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(Rigidbody2D, "type", { type: RigidbodyTypeAdapter });

    this.#initializeBody();

    const typeValue = this.values.get("type");
    this.listen(this.game.values, ValueChanged, event => {
      if (event.value !== typeValue) return;

      this.#initializeBody();
    });

    // EntityPreUpdate happens before physics runs, so we can set the physics body to match our transform
    this.on(
      EntityPreUpdate,
      () => {
        if (!this.game.physics.enabled) return;
        if (!this.#internal) return;

        this.#internal.body.setTranslation(
          {
            x: this.globalTransform.position.x,
            y: this.globalTransform.position.y,
          },
          false,
        );
        this.#internal.body.setRotation(this.globalTransform.rotation, false);
        this.#internal.shape.halfExtents = {
          x: this.globalTransform.scale.x / 2,
          y: this.globalTransform.scale.y / 2,
        };
      },
      -10,
    );

    // EntityUpdate happens after physics runs, so we can update our transform
    // to reflect the movement of the physics body
    this.on(
      EntityUpdate,
      () => {
        if (!this.game.physics.enabled) return;
        if (!this.#internal) return;

        // FIXME: free-for-all entities should not have transform reported from the client for benign physics transform updates
        // for now, we just don't update the transform on the client.
        if (this.authority === undefined && this.game.isClient()) return;

        this.globalTransform.position = new Vector2(this.#internal.body.translation());
        this.globalTransform.rotation = this.#internal.body.rotation();
        this.globalTransform.scale = new Vector2(
          this.#internal.shape.halfExtents.x * 2,
          this.#internal.shape.halfExtents.y * 2,
        );
      },
      10,
    );

    this.on(EntityDestroyed, () => {
      if (this.#internal) this.game.physics.world.removeRigidBody(this.#internal.body);
    });
  }

  #initializeBody() {
    if (this.#internal) {
      this.game.physics.world.removeRigidBody(this.#internal.body);
    }

    // dont run if in prefab tree
    if (this.root === this.game.prefabs) return;

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

    const body = this.game.physics.world.createRigidBody(desc);
    const cuboid = RAPIER.ColliderDesc.cuboid(
      this.globalTransform.scale.x / 2,
      this.globalTransform.scale.y / 2,
    );

    const collider = this.game.physics.world.createCollider(cuboid, body);
    collider.setActiveCollisionTypes(
      RAPIER.ActiveCollisionTypes.DEFAULT |
        RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED |
        RAPIER.ActiveCollisionTypes.FIXED_FIXED,
    );
    collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    const shape = collider.shape as RAPIER.Cuboid;

    this.game.physics.registerBody(this, body);
    this.#internal = { body, collider, shape };
  }
}
