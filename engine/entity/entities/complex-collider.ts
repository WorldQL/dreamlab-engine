import {
  Bounds,
  Entity,
  EntityContext,
  EntityDestroyed,
  EntityEnableChanged,
  EntityReparented,
  EntityTransformUpdate,
  IBounds,
  Rigidbody,
  childrenSorted,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { quickDecomp as decomp, makeCCW } from "@dreamlab/vendor/poly-decomp-es.ts";
import RAPIER, { RigidBody } from "@dreamlab/vendor/rapier.ts";

export class ComplexCollider extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon: string = "🧱";
  isSensor: boolean = false;
  mass: number = 1;

  #rigidbody: Rigidbody | undefined;
  #internal: { colliders: RAPIER.Collider[] } | undefined;

  readonly bounds: IBounds = Bounds.ONE;

  get colliders(): RAPIER.Collider[] {
    if (!this.#internal) throw new Error("attempted to access .colliders on a prefab object");
    return this.#internal.colliders;
  }

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValue(ComplexCollider, "isSensor", {
      description:
        "Indicates whether this collider is a sensor (doesn't trigger collisions but detects overlap).",
    });

    this.defineValue(ComplexCollider, "mass", {
      description: "The mass of the collider, affecting its response to forces.",
    });

    this.values.get("isSensor")?.onChanged((newValue: boolean) => {
      if (this.#internal) {
        for (const collider of this.#internal.colliders) {
          collider.setSensor(newValue);
        }
      }
    });

    this.values.get("mass")?.onChanged((newValue: number) => {
      if (this.#internal) {
        for (const collider of this.#internal.colliders) {
          collider.setMass(newValue);
        }
      }
    });
  }

  onInitialize(): void {
    this.#rigidbody = this.parent instanceof Rigidbody ? this.parent : undefined;
    this.#setupCollider(this.#rigidbody?.body);

    this.on(EntityDestroyed, () => {
      if (this.#internal) {
        for (const collider of this.#internal.colliders) {
          this.game.physics.world.removeCollider(collider, false);
        }

        this.#internal = undefined;
      }
    });

    this.on(EntityReparented, () => {
      this[internal.colliderReparentBody]();
    });

    this.on(EntityEnableChanged, ({ enabled }) => {
      this.#setupCollider();
      for (const collider of this.#internal?.colliders ?? []) {
        collider.setEnabled(enabled);
      }
    });

    this.on(EntityTransformUpdate, ({ source }) => {
      if (source !== this) this[internal.entityPreparePhysicsUpdate]();
    });
  }

  [internal.colliderReparentBody]() {
    if (this.#internal) {
      for (const collider of this.#internal.colliders) {
        this.game.physics.world.removeCollider(collider, false);
      }

      this.#internal = undefined;
    }

    this.#rigidbody = this.parent instanceof Rigidbody ? this.parent : undefined;
    this.#setupCollider(this.#rigidbody?.body);
  }

  #setupCollider(body?: RigidBody) {
    const enabled = this.enabled && !this.#internal;
    if (!enabled) return;

    const points = childrenSorted(this).map((child): [number, number] => [
      child.transform.position.x,
      child.transform.position.y,
    ]);

    makeCCW(points);
    const convex = decomp(points);
    if (!convex) {
      console.warn("failed to decompose points");
      return;
    }

    const colliders: RAPIER.Collider[] = [];
    for (const polygon of convex) {
      const points = Float32Array.from(polygon.flat());
      const desc = RAPIER.ColliderDesc.convexHull(Float32Array.from(points));

      if (!desc) {
        console.warn("failed to construct convex hull");
        return;
      }

      desc
        .setTranslation(this.globalTransform.position.x, this.globalTransform.position.y)
        .setRotation(this.globalTransform.rotation);

      // TODO: mass

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
      colliders.push(collider);
    }

    this.#internal = { colliders };
  }

  [internal.applyNetworkInterpolation](): void {
    super[internal.applyNetworkInterpolation]();
    this[internal.entityPreparePhysicsUpdate]();
  }

  onUpdate(): void {
    this[internal.entityApplyPhysicsUpdate]();
    super.onUpdate();
  }

  [internal.entityPreparePhysicsUpdate]() {
    if (!this.game.physics.enabled || !this.#internal || this.#rigidbody) return;

    /*
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
    */
  }

  [internal.entityApplyPhysicsUpdate]() {
    if (!this.game.physics.enabled || !this.#internal || this.#rigidbody) return;

    /*
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
    */
  }

  // /**
  //  * Returns an array of Collider entities that are currently intersecting with this collider
  //  * @returns Array of intersecting Collider entities
  //  */
  // getIntersecting(): Collider[] {
  //   if (!this.#internal) return [];

  //   const world = this.game.physics.world;
  //   const position = this.#internal.collider.translation();
  //   const rotation = this.#internal.collider.rotation();

  //   let queryShape: RAPIER.Shape;
  //   if (this.shape === "Rectangle" && this.#internal.shape instanceof RAPIER.Cuboid) {
  //     queryShape = new RAPIER.Cuboid(
  //       this.#internal.shape.halfExtents.x,
  //       this.#internal.shape.halfExtents.y,
  //     );
  //   } else if (this.shape === "Circle" && this.#internal.shape instanceof RAPIER.Ball) {
  //     queryShape = new RAPIER.Ball(this.#internal.shape.radius);
  //   } else {
  //     return [];
  //   }

  //   const intersecting: Collider[] = [];
  //   world.intersectionsWithShape(position, rotation, queryShape, collider => {
  //     if (collider === this.#internal?.collider) return true;

  //     // deno-lint-ignore no-explicit-any
  //     const userData = (collider as RAPIER.Collider & { userData?: any }).userData;
  //     if (userData && typeof userData === "object" && "entityRef" in userData) {
  //       const entity = this.game.entities.lookupByRef(userData.entityRef as string);
  //       if (entity instanceof Collider) {
  //         intersecting.push(entity);
  //       }
  //     }
  //     return true;
  //   });

  //   return intersecting;
  // }
}
