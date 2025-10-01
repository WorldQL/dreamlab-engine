import { Entity, EntityCollision, Game, Vector2 } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type {
  Collider,
  KinematicCharacterController,
  RigidBody,
} from "@dreamlab/vendor/rapier.ts";
import RAPIER from "@dreamlab/vendor/rapier.ts";

interface ColliderWithUserData extends Collider {
  userData?: unknown;
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

  lookupEntity(colliderOrBody: Collider | RigidBody): Entity | undefined {
    const udata = (colliderOrBody as ColliderWithUserData | RigidBody)?.userData as unknown;

    let entityRef: string | undefined;
    if (
      udata &&
      typeof udata === "object" &&
      "entityRef" in udata &&
      typeof udata.entityRef === "string"
    ) {
      entityRef = udata.entityRef;
    }

    if (!entityRef) return;
    return this.game.entities.lookupByRef(entityRef);
  }

  #lookupEntity(handlerOrCollider: Collider | RAPIER.ColliderHandle): Entity | undefined {
    const collider =
      typeof handlerOrCollider === "number"
        ? this.world.getCollider(handlerOrCollider)
        : handlerOrCollider;

    return this.lookupEntity(collider);
  }

  tick() {
    if (this.enabled) this.world.step(this.#events);

    const contactForces = new Map<Entity, { other: Entity; force: Vector2 }[]>();

    this.#events.drainContactForceEvents(ev => {
      const collider1 = this.world.getCollider(ev.collider1());
      const collider2 = this.world.getCollider(ev.collider2());

      const entity1 = this.#lookupEntity(collider1);
      const entity2 = this.#lookupEntity(collider2);
      if (!entity1 || !entity2) return;
      if (entity1.destroyed || entity2.destroyed) return;

      const force = new Vector2(ev.totalForce());
      const force1 = contactForces.get(entity1) ?? [];
      const force2 = contactForces.get(entity2) ?? [];
      force1.push({ other: entity2, force });
      contactForces.set(entity1, force1);
      force2.push({ other: entity2, force });
      contactForces.set(entity2, force2);
    });

    const collisionEventQueue: {
      started: boolean;
      entity1: Entity;
      entity2: Entity;
      contact1: Vector2;
      contact2: Vector2;
      normal1: Vector2;
      normal2: Vector2;
      force: Vector2;
    }[] = [];

    this.#events.drainCollisionEvents((handle1, handle2, started) => {
      const collider1 = this.world.getCollider(handle1);
      const collider2 = this.world.getCollider(handle2);

      const entity1 = this.#lookupEntity(collider1);
      const entity2 = this.#lookupEntity(collider2);
      if (!entity1 || !entity2) return;
      if (entity1.destroyed || entity2.destroyed) return;

      const normal1 = Vector2.ZERO;
      const normal2 = Vector2.ZERO;
      const contact1 = Vector2.ZERO;
      const contact2 = Vector2.ZERO;

      this.world.narrowPhase.contactPair(handle1, handle2, (manifold, flipped) => {
        const localNormal1 = manifold.localNormal1();
        const localNormal2 = manifold.localNormal2();

        if (flipped) {
          normal1.assign(localNormal2);
          normal2.assign(localNormal1);
        } else {
          normal1.assign(localNormal1);
          normal2.assign(localNormal2);
        }

        // TODO: contact points
      });

      const force1 = contactForces
        .get(entity1)
        ?.filter(it => it.other === entity2)
        ?.reduce((a, b) => a.add(b.force), Vector2.ZERO);
      const force2 = contactForces
        .get(entity2)
        ?.filter(it => it.other === entity1)
        ?.reduce((a, b) => a.add(b.force), Vector2.ZERO);
      const force = (force1 ?? Vector2.ZERO).add(force2 ?? Vector2.ZERO).div(2);

      collisionEventQueue.push({
        started,
        entity1,
        entity2,
        contact1,
        contact2,
        normal1,
        normal2,
        force,
      });
    });

    for (const {
      started,
      entity1,
      entity2,
      contact1,
      contact2,
      normal1,
      normal2,
      force,
    } of collisionEventQueue) {
      entity1.fire(EntityCollision, started, entity2, contact1, normal1, force);
      entity2.fire(EntityCollision, started, entity1, contact2, normal2, force);
    }
  }

  #activeCollisions = new Map<string, number>(); // key -> missing ticks counter
  #makeCollisionKey(controllerHandle: number, entity1Ref: string, entity2Ref: string): string {
    const [first, second] = [entity1Ref, entity2Ref].sort();
    return `${controllerHandle}:${first}:${second}`;
  }

  [internal.emitCharacterControllerCollisions](
    collider: Collider,
    controller: KinematicCharacterController,
  ): void {
    if (!controller) throw new TypeError("missing controller param");
    const controllerHandle = collider.handle;
    const currentTickCollisions = new Set<string>();

    const body1 = collider as ColliderWithUserData;
    for (let i = 0; i < controller.numComputedCollisions(); i++) {
      const collision = controller.computedCollision(i);
      if (!collision) continue;

      const body2 = (collision.collider ?? undefined) as ColliderWithUserData | undefined;
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
      if (entity1.destroyed || entity2.destroyed) return;

      const collisionKey = this.#makeCollisionKey(controllerHandle, entityRef1, entityRef2);
      currentTickCollisions.add(collisionKey);

      // If this is a new collision, emit start event
      if (!this.#activeCollisions.has(collisionKey)) {
        this.#activeCollisions.set(collisionKey, 0);

        entity1.fire(
          EntityCollision,
          true,
          entity2,
          new Vector2(collision.witness2),
          new Vector2(collision.normal2),
          Vector2.ZERO,
        );

        entity2.fire(
          EntityCollision,
          true,
          entity1,
          new Vector2(collision.witness1),
          new Vector2(collision.normal1),
          Vector2.ZERO,
        );
      } else {
        // Reset missing ticks counter for active collision
        this.#activeCollisions.set(collisionKey, 0);
      }
    }

    // Check for ended collisions, but only for this controller's collisions
    for (const [key, missingTicks] of this.#activeCollisions) {
      // Only process keys that belong to this controller
      if (!key.startsWith(`${controllerHandle}:`)) continue;

      if (!currentTickCollisions.has(key)) {
        // Increment missing ticks counter
        const newMissingTicks = missingTicks + 1;
        if (newMissingTicks >= 2) {
          // Remove collision after 5 missing ticks
          this.#activeCollisions.delete(key);
          // Could fire end collision event here if needed
        } else {
          this.#activeCollisions.set(key, newMissingTicks);
        }
      }
    }
  }

  shutdown() {
    this.world?.free();
    this.#events?.free();
  }
}
