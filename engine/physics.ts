import RAPIER, {
  Collider,
  KinematicCharacterController,
  RigidBody,
} from "@dreamlab/vendor/rapier.ts";
import { Entity } from "./entity/mod.ts";
import { Game } from "./game.ts";
import { EntityCollision } from "./signals/entity-collision.ts";

interface ColliderWithUserData extends Collider {
  // deno-lint-ignore no-explicit-any
  userData?: any;
}

export class PhysicsEngine {
  game: Game;

  world: RAPIER.World;
  #events: RAPIER.EventQueue;
  readonly tickDelta: number;

  // TODO: figure out how to network sync this
  enabled: boolean = true;

  constructor(game: Game) {
    this.game = game;

    this.tickDelta = 1000.0 / game.time.TPS;
    this.world = new RAPIER.World({ x: 0, y: -9.81 });
    this.world.integrationParameters.dt = 1.0 / game.time.TPS;
    this.#events = new RAPIER.EventQueue(true);
  }

  registerBody(entity: Entity, body: RigidBody) {
    const ud = (typeof body.userData === "object" ? body.userData : undefined) ?? {};
    body.userData = { ...ud, entityRef: entity.ref };
  }

  registerCollider(entity: Entity, collider: ColliderWithUserData) {
    const ud = (typeof collider.userData === "object" ? collider.userData : undefined) ?? {};
    collider.userData = { ...ud, entityRef: entity.ref };
  }

  tick() {
    if (this.enabled) this.world.step(this.#events);
    this.#events.drainCollisionEvents((handle1, handle2, started) => {
      // const body1 = this.world.bodies.get(handle1);
      // const body2 = this.world.bodies.get(handle2);

      const body1 = this.world.colliders.get(handle1) as ColliderWithUserData;
      const body2 = this.world.colliders.get(handle2) as ColliderWithUserData;

      const udata1 = body1?.userData;
      const udata2 = body2?.userData;

      let entityRef1: string | undefined;
      let entityRef2: string | undefined;
      if (udata1 && typeof udata1 === "object" && "entityRef" in udata1) {
        entityRef1 = udata1.entityRef as string;
      }
      if (udata2 && typeof udata2 === "object" && "entityRef" in udata2) {
        entityRef2 = udata2.entityRef as string;
      }

      if (!entityRef1 || !entityRef2) return;
      const entity1 = this.game.entities.lookupByRef(entityRef1);
      const entity2 = this.game.entities.lookupByRef(entityRef2);
      if (!entity1 || !entity2) return;

      entity1.fire(EntityCollision, started, entity2);
      entity2.fire(EntityCollision, started, entity1);
    });
  }

  private activeCollisions = new Set<string>();

  private makeCollisionKey(entity1Ref: string, entity2Ref: string): string {
    const [first, second] = [entity1Ref, entity2Ref].sort();
    return `${first}:${second}`;
  }

  emitCharacterControllerCollisions(
    collider: Collider,
    controller: KinematicCharacterController,
  ): void {
    if (!controller) throw new TypeError("missing controller param");
    // Create a set for this tick's collisions
    const currentTickCollisions = new Set<string>();

    const body1 = collider as ColliderWithUserData;
    for (let i = 0; i < controller.numComputedCollisions(); i++) {
      const collision = controller.computedCollision(i);
      const body2 = (collision?.collider ?? undefined) as ColliderWithUserData | undefined;
      if (!body2) continue;

      const udata1 = body1?.userData;
      const udata2 = body2?.userData;

      let entityRef1: string | undefined;
      let entityRef2: string | undefined;
      if (udata1 && typeof udata1 === "object" && "entityRef" in udata1) {
        entityRef1 = udata1.entityRef as string;
      }
      if (udata2 && typeof udata2 === "object" && "entityRef" in udata2) {
        entityRef2 = udata2.entityRef as string;
      }

      if (!entityRef1 || !entityRef2) continue;
      const entity1 = this.game.entities.lookupByRef(entityRef1);
      const entity2 = this.game.entities.lookupByRef(entityRef2);
      if (!entity1 || !entity2) continue;

      // Create unique key for this collision
      const collisionKey = this.makeCollisionKey(entityRef1, entityRef2);

      // Add to current tick's collisions
      currentTickCollisions.add(collisionKey);

      // If this is a new collision, emit start event
      if (!this.activeCollisions.has(collisionKey)) {
        this.activeCollisions.add(collisionKey);
        entity1.fire(EntityCollision, true, entity2); // true = collision start
        entity2.fire(EntityCollision, true, entity1);
      }
    }

    // Check for ended collisions
    for (const key of this.activeCollisions) {
      if (!currentTickCollisions.has(key)) {
        // This collision is no longer active
        this.activeCollisions.delete(key);

        // Parse the key to get entity refs
        const [_, ref1, ref2] = key.split(":");
        const entity1 = this.game.entities.lookupByRef(ref1);
        const entity2 = this.game.entities.lookupByRef(ref2);

        if (entity1 && entity2) {
          entity1.fire(EntityCollision, false, entity2); // false = collision end
          entity2.fire(EntityCollision, false, entity1);
        }
      }
    }
  }

  shutdown() {
    this.world.free();
    this.#events.free();
  }
}
