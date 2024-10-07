import RAPIER, { Collider, RigidBody } from "@dreamlab/vendor/rapier.ts";
import { Entity, EntityStore } from "./entity/mod.ts";
import { Game } from "./game.ts";
import { EntityCollision } from "./signals/entity-collision.ts";

interface ColliderWithUserData extends Collider {
  // deno-lint-ignore no-explicit-any
  userData?: any;
}

export interface PhysicsRealm {
  readonly world: RAPIER.World;
  readonly events: RAPIER.EventQueue;
}

export function createPhysicsRealm(game: Game): PhysicsRealm {
  const world = new RAPIER.World({ x: 0, y: -9.81 });
  world.integrationParameters.dt = 1.0 / game.time.TPS;
  const events = new RAPIER.EventQueue(true);
  return { world, events };
}

export function freePhysicsRealm(realm: PhysicsRealm) {
  realm.world.free();
  realm.events.free();
}

export class PhysicsEngine {
  game: Game;

  readonly tickDelta: number;

  // TODO: figure out how to network sync this
  enabled: boolean = true;

  constructor(game: Game) {
    this.game = game;

    this.tickDelta = 1000.0 / game.time.TPS;
  }

  registerBody(entity: Entity, body: RigidBody) {
    const ud = (typeof body.userData === "object" ? body.userData : undefined) ?? {};
    body.userData = { ...ud, entityRef: entity.ref };
  }

  registerCollider(entity: Entity, collider: ColliderWithUserData) {
    const ud = (typeof collider.userData === "object" ? collider.userData : undefined) ?? {};
    collider.userData = { ...ud, entityRef: entity.ref };
  }

  tick(entities: EntityStore, world: RAPIER.World, events: RAPIER.EventQueue) {
    if (this.enabled) world.step(events);
    events.drainCollisionEvents((handle1, handle2, started) => {
      const body1 = world.colliders.get(handle1) as ColliderWithUserData;
      const body2 = world.colliders.get(handle2) as ColliderWithUserData;

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
      const entity1 = entities.lookupByRef(entityRef1);
      const entity2 = entities.lookupByRef(entityRef2);
      if (!entity1 || !entity2) return;

      entity1.fire(EntityCollision, started, entity2);
      entity2.fire(EntityCollision, started, entity1);
    });
  }
}
