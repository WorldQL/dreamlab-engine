import {
  Bounds,
  Entity,
  EntityContext,
  EntityDestroyed,
  EntityEnableChanged,
  EntityReparented,
  EntityTransformUpdate,
  enumAdapter,
  IBounds,
  Rigidbody,
  Vector2,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import RAPIER, { RigidBody } from "@dreamlab/vendor/rapier.ts";

/**
 * @deprecated Use {@link Collider} with shape set to `Rectangle` instead.
 */
export class RectCollider extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🧱";
  readonly bounds: IBounds = Bounds.ONE;

  #internal: { collider: RAPIER.Collider; shape: RAPIER.Cuboid } | undefined;

  isSensor: boolean = false;

  get collider(): RAPIER.Collider {
    if (!this.#internal) throw new Error("attempted to access .collider on a prefab object");
    return this.#internal.collider;
  }

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValue(RectCollider, "isSensor");

    this.values.get("isSensor")?.onChanged((newValue: boolean) => {
      if (this.#internal) {
        this.#internal.collider.setSensor(newValue);
      }
    });
  }

  onInitialize(): void {
    this.#setupCollider();

    this.on(EntityDestroyed, () => {
      if (this.#internal) {
        this.game.physics.world.removeCollider(this.#internal.collider, false);
        this.#internal = undefined;
      }
    });

    this.on(EntityEnableChanged, ({ enabled }) => {
      this.#setupCollider();
      this.#internal?.collider.setEnabled(enabled);
    });
  }

  #setupCollider() {
    if (this.enabled && !this.#internal) {
      const desc = RAPIER.ColliderDesc.cuboid(
        this.globalTransform.scale.x / 2,
        this.globalTransform.scale.y / 2,
      )
        .setTranslation(this.globalTransform.position.x, this.globalTransform.position.y)
        .setRotation(this.globalTransform.rotation);

      const collider = this.game.physics.world.createCollider(desc);
      collider.setActiveCollisionTypes(
        RAPIER.ActiveCollisionTypes.DEFAULT |
          RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED |
          RAPIER.ActiveCollisionTypes.FIXED_FIXED,
      );
      this.game.physics.registerCollider(this, collider);
      collider.setActiveEvents(
        RAPIER.ActiveEvents.COLLISION_EVENTS | RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS,
      );
      const shape = collider.shape as RAPIER.Cuboid;
      collider.setSensor(this.isSensor);

      this.#internal = { collider, shape };
    }
  }

  [internal.applyNetworkInterpolation](): void {
    super[internal.applyNetworkInterpolation]();
    this.#preparePhysicsUpdate();
  }

  onUpdate(): void {
    this.#applyPhysicsUpdate();
    super.onUpdate();
  }

  #preparePhysicsUpdate() {
    if (!this.game.physics.enabled) return;
    if (!this.#internal) return;

    this.#internal.collider.setTranslation({
      x: this.globalTransform.position.x,
      y: this.globalTransform.position.y,
    });
    this.#internal.collider.setRotation(this.globalTransform.rotation);
    this.#internal.shape.halfExtents = {
      x: this.globalTransform.scale.x / 2,
      y: this.globalTransform.scale.y / 2,
    };
  }

  #applyPhysicsUpdate() {
    if (!this.game.physics.enabled) return;
    if (!this.#internal) return;

    // FIXME: free-for-all entities should not have transform reported from the client for benign physics transform updates
    // for now, we just don't update the transform on the client.
    if (this.authority === undefined && this.game.isClient()) return;

    this.globalTransform.position = new Vector2(this.#internal.collider.translation());
    this.globalTransform.rotation = this.#internal.collider.rotation();
    this.globalTransform.scale = new Vector2(
      this.#internal.shape.halfExtents.x * 2,
      this.#internal.shape.halfExtents.y * 2,
    );
  }
}

// #region NEW COLLIDER
// TODO: implement capsule collider
type ColliderShape = enumAdapter.Union<typeof ColliderShapeAdapter>;
const ColliderShapeAdapter = enumAdapter(["Rectangle", "Circle" /*, "Capsule" */]);

export class Collider extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon: string = "🧱";
  shape: ColliderShape = "Rectangle";
  isSensor: boolean = false;
  mass: number = 1;
  restitution: number = 0;
  friction: number = 1;

  #rigidbody: Rigidbody | undefined;
  #internal:
    | { collider: RAPIER.Collider; shape: RAPIER.Cuboid | RAPIER.Ball | RAPIER.Capsule }
    | undefined;

  readonly bounds: IBounds = Bounds.ONE;

  get collider(): RAPIER.Collider {
    if (this.root === this.game.prefabs) {
      throw new Error("attempted to access .collider on a prefab object");
    }

    if (this.#internal) return this.#internal.collider;

    this.#rigidbody = this.parent instanceof Rigidbody ? this.parent : undefined;
    this.#setupCollider(this.#rigidbody?.body);
    return this.#internal!.collider;
  }

  constructor(ctx: EntityContext, shape: ColliderShape = "Rectangle") {
    super(ctx);
    this.shape = shape;
    this.defineValue(Collider, "isSensor", {
      description:
        "Determines if the collider is a sensor (detects collisions without affecting physics).",
    });
    this.defineValue(Collider, "shape", {
      type: ColliderShapeAdapter,
      description: "Shape of the collider.",
    });
    this.defineValue(Collider, "mass", {
      description: "Mass of the collider, used for physics calculations.",
    });
    this.defineValue(Collider, "restitution", {
      description: "Coefficient of restitution [0-1], used for physics calculations.",
    });
    this.defineValue(Collider, "friction", {
      description: "Friction coefficient, used for physics calculations.",
    });

    this.values.get("isSensor")?.onChanged((newValue: boolean) => {
      if (this.#internal) {
        this.#internal.collider.setSensor(newValue);
      }
    });

    this.values.get("mass")?.onChanged((newValue: number) => {
      if (this.#internal) {
        this.#internal.collider.setMass(newValue);
      }
    });

    this.values.get("restitution")?.onChanged((newValue: number) => {
      if (this.#internal) {
        this.#internal.collider.setRestitution(newValue);
      }
    });

    this.values.get("friction")?.onChanged((newValue: number) => {
      if (this.#internal) {
        this.#internal.collider.setFriction(newValue);
      }
    });
  }

  onInitialize(): void {
    if (this.enabled && this.root !== this.game.prefabs) {
      this.#rigidbody = this.parent instanceof Rigidbody ? this.parent : undefined;
      this.#setupCollider(this.#rigidbody?.body);
    }

    this.on(EntityDestroyed, () => {
      if (this.#internal) {
        this.game.physics.world.removeCollider(this.#internal.collider, false);
        this.#internal = undefined;
      }
    });

    this.on(EntityReparented, () => {
      this[internal.colliderReparentBody]();
    });

    this.on(EntityEnableChanged, ({ enabled }) => {
      this.#setupCollider();
      this.#internal?.collider.setEnabled(enabled);
    });

    this.on(EntityTransformUpdate, ({ source }) => {
      if (source !== this) this[internal.entityPreparePhysicsUpdate]();
    });
  }

  [internal.colliderReparentBody]() {
    if (this.#internal) {
      this.game.physics.world.removeCollider(this.#internal.collider, false);
      this.#internal = undefined;
    }

    if (this.root === this.game.prefabs) return;

    this.#rigidbody = this.parent instanceof Rigidbody ? this.parent : undefined;
    this.#setupCollider(this.#rigidbody?.body);
  }

  #setupCollider(body?: RigidBody) {
    if (this.enabled && !this.#internal) {
      const desc =
        this.shape === "Rectangle"
          ? RAPIER.ColliderDesc.cuboid(
              this.globalTransform.scale.x / 2,
              this.globalTransform.scale.y / 2,
            )
          : this.shape === "Circle"
            ? RAPIER.ColliderDesc.ball(this.globalTransform.scale.x / 2)
            : RAPIER.ColliderDesc.capsule(
                this.globalTransform.scale.y / 2,
                this.globalTransform.scale.x / 2,
              );

      desc
        .setTranslation(this.globalTransform.position.x, this.globalTransform.position.y)
        .setRotation(this.globalTransform.rotation)
        .setMass(this.mass)
        .setRestitution(this.restitution)
        .setFriction(this.friction);

      if (body) {
        desc.setTranslation(this.transform.position.x, this.transform.position.y);
        desc.setRotation(this.transform.rotation);
      }

      const collider = body
        ? this.game.physics.world.createCollider(desc, body)
        : this.game.physics.world.createCollider(desc);
      collider.setActiveCollisionTypes(
        RAPIER.ActiveCollisionTypes.DEFAULT |
          RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED |
          RAPIER.ActiveCollisionTypes.FIXED_FIXED,
      );
      this.game.physics.registerCollider(this, collider);
      collider.setActiveEvents(
        RAPIER.ActiveEvents.COLLISION_EVENTS | RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS,
      );
      collider.setSensor(this.isSensor);

      this.#internal = {
        collider,
        shape: desc.shape as RAPIER.Cuboid | RAPIER.Ball | RAPIER.Capsule,
      };
    }
  }

  [internal.applyNetworkInterpolation](): void {
    super[internal.applyNetworkInterpolation]();
    this[internal.entityPreparePhysicsUpdate]();
  }

  onUpdate(): void {
    if (this.#rigidbody) {
      this[internal.entityApplyPhysicsUpdate]();
    }
    super.onUpdate();
  }

  [internal.entityPreparePhysicsUpdate]() {
    if (!this.game.physics.enabled || !this.#internal || this.#rigidbody) return;

    this.#internal.collider.setTranslation({
      x: this.globalTransform.position.x,
      y: this.globalTransform.position.y,
    });
    this.#internal.collider.setRotation(this.globalTransform.rotation);

    if (this.shape === "Rectangle" && this.#internal.shape instanceof RAPIER.Cuboid) {
      this.#internal.collider.setHalfExtents({
        x: this.globalTransform.scale.x / 2,
        y: this.globalTransform.scale.y / 2,
      });
    } else if (this.shape === "Circle" && this.#internal.shape instanceof RAPIER.Ball) {
      this.#internal.collider.setRadius(this.globalTransform.scale.x / 2);
    }
    // else if (this.shape === "Capsule" && this.#internal.shape instanceof RAPIER.Capsule) {
    //   this.#internal.collider.setRadius(this.globalTransform.scale.x / 2);
    //   this.#internal.collider.setHalfHeight(this.globalTransform.scale.y / 2);
    // }
  }

  [internal.entityApplyPhysicsUpdate]() {
    if (!this.game.physics.enabled || !this.#internal || this.#rigidbody) return;

    const authority = this.authority ?? "server";
    if (authority !== this.game.network.self) return;

    this.globalTransform.position = new Vector2(this.#internal.collider.translation());
    this.globalTransform.rotation = this.#internal.collider.rotation();

    if (this.shape === "Rectangle" && this.#internal.shape instanceof RAPIER.Cuboid) {
      this.globalTransform.scale = new Vector2(
        this.#internal.shape.halfExtents.x * 2,
        this.#internal.shape.halfExtents.y * 2,
      );
    } else if (this.shape === "Circle" && this.#internal.shape instanceof RAPIER.Ball) {
      this.globalTransform.scale = new Vector2(
        this.#internal.shape.radius * 2,
        this.#internal.shape.radius * 2,
      );
    }
    // else if (this.shape === "Capsule" && this.#internal.shape instanceof RAPIER.Capsule) {
    //   this.globalTransform.scale = new Vector2(
    //     this.#internal.shape.radius * 2,
    //     this.#internal.shape.halfHeight * 2,
    //   );
    // }
  }

  /**
   * Returns an array of Collider entities that are currently intersecting with this collider
   * @returns Array of intersecting Collider entities
   */
  getIntersecting(): Collider[] {
    if (!this.#internal) return [];

    const world = this.game.physics.world;
    const position = this.#internal.collider.translation();
    const rotation = this.#internal.collider.rotation();

    let queryShape: RAPIER.Shape;
    if (this.shape === "Rectangle" && this.#internal.shape instanceof RAPIER.Cuboid) {
      queryShape = new RAPIER.Cuboid(
        this.#internal.shape.halfExtents.x,
        this.#internal.shape.halfExtents.y,
      );
    } else if (this.shape === "Circle" && this.#internal.shape instanceof RAPIER.Ball) {
      queryShape = new RAPIER.Ball(this.#internal.shape.radius);
    } else {
      return [];
    }

    const intersecting: Collider[] = [];
    world.intersectionsWithShape(position, rotation, queryShape, collider => {
      if (collider === this.#internal?.collider) return true;

      // deno-lint-ignore no-explicit-any
      const userData = (collider as RAPIER.Collider & { userData?: any }).userData;
      if (userData && typeof userData === "object" && "entityRef" in userData) {
        const entity = this.game.entities.lookupByRef(userData.entityRef as string);
        if (entity instanceof Collider) {
          intersecting.push(entity);
        }
      }
      return true;
    });

    return intersecting;
  }
}
