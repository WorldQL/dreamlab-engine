import RAPIER, { RigidBody } from "./deps/rapier.ts";
import { Entity } from "./entity.ts";
import { Game } from "./game.ts";
import { EntityCollision } from "./signals/entity-collision.ts";

export class PhysicsEngine {
  game: Game;

  world: RAPIER.World;
  #events: RAPIER.EventQueue;
  readonly tickDelta: number;

  constructor(game: Game) {
    this.game = game;

    const tps = 60;
    this.tickDelta = 1000.0 / tps;
    this.world = new RAPIER.World({ x: 0, y: -9.81 });
    this.world.integrationParameters.dt = 1.0 / tps;
    this.#events = new RAPIER.EventQueue(true);
  }

  registerBody(entity: Entity, body: RigidBody) {
    const ud =
      (typeof body.userData === "object" ? body.userData : undefined) ?? {};
    body.userData = { ...ud, entityUid: entity.uid };
  }

  tick() {
    this.world.step(this.#events);
    this.#events.drainCollisionEvents((handle1, handle2, started) => {
      const body1 = this.world.bodies.get(handle1);
      const body2 = this.world.bodies.get(handle2);

      const udata1 = body1?.userData;
      const udata2 = body2?.userData;

      let entityUid1: string | undefined;
      let entityUid2: string | undefined;
      if (udata1 && typeof udata1 === "object" && "entityUid" in udata1) {
        entityUid1 = udata1.entityUid as string;
      }
      if (udata2 && typeof udata2 === "object" && "entityUid" in udata2) {
        entityUid2 = udata2.entityUid as string;
      }

      if (!entityUid1 || !entityUid2) return;
      const entity1 = this.game.entities.lookupByUid(entityUid1);
      const entity2 = this.game.entities.lookupByUid(entityUid2);
      if (!entity1 || !entity2) return;

      entity1.fire(EntityCollision, started, entity2);
      entity2.fire(EntityCollision, started, entity1);
    });
  }

  shutdown() {
    this.world.free();
    this.#events.free();
  }
}
