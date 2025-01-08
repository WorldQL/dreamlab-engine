import RAPIER, {
  Collider,
  KinematicCharacterController,
  RigidBody,
} from "@dreamlab/vendor/rapier.ts";
import { Entity } from "./entity/mod.ts";
import { Game } from "./game.ts";
import { Vector2 } from "./math/mod.ts";
import { EntityCollision } from "./signals/entity-collision.ts";

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

  #lookupEntity(handlerOrCollider: Collider | RAPIER.ColliderHandle): Entity | undefined {
    const body =
      typeof handlerOrCollider === "number"
        ? this.world.getCollider(handlerOrCollider)
        : handlerOrCollider;

    const udata = (body as ColliderWithUserData)?.userData as unknown;

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

  tick() {
    if (this.enabled) this.world.step(this.#events);
    this.#events.drainCollisionEvents((handle1, handle2, started) => {
      const collider1 = this.world.getCollider(handle1);
      const collider2 = this.world.getCollider(handle2);

      const entity1 = this.#lookupEntity(collider1);
      const entity2 = this.#lookupEntity(collider2);
      if (!entity1 || !entity2) return;

      // TODO: lookup contact pairs figure out contact point and normal

      entity1.fire(EntityCollision, started, entity2, Vector2.ZERO, Vector2.ZERO); // TODO
      entity2.fire(EntityCollision, started, entity1, Vector2.ZERO, Vector2.ZERO); // TODO
    });
  }

  #activeCollisions = new Map<string, number>(); // key -> missing ticks counter
  #makeCollisionKey(controllerHandle: number, entity1Ref: string, entity2Ref: string): string {
    const [first, second] = [entity1Ref, entity2Ref].sort();
    return `${controllerHandle}:${first}:${second}`;
  }

  emitCharacterControllerCollisions(
    collider: Collider,
    controller: KinematicCharacterController,
  ): void {
    if (!controller) throw new TypeError("missing controller param");

    const controllerHandle = collider.handle;
    const controllerEntity = this.#lookupEntity(controllerHandle);
    if (!controllerEntity) return;

    const currentTickCollisions = new Set<string>();
    for (let i = 0; i < controller.numComputedCollisions(); i++) {
      const collision = controller.computedCollision(i);
      if (!collision) continue;

      const colliderHandle = collision.collider?.handle ?? undefined;
      if (!colliderHandle) continue;

      const colliderEntity = this.#lookupEntity(colliderHandle);
      if (!colliderEntity) continue;

      const collisionKey = this.#makeCollisionKey(
        controllerHandle,
        controllerEntity.ref,
        colliderEntity.ref,
      );
      currentTickCollisions.add(collisionKey);

      // TODO: docs say some of these are world space and some are local space
      // this appears to be wrong? needs further investigation
      const colliderContactPoint = new Vector2(collision.witness1);
      const controllerContactPoint = new Vector2(collision.witness2);
      const colliderNormal = new Vector2(collision.normal1);
      const controllerNormal = new Vector2(collision.normal2);

      // If this is a new collision, emit start event
      if (!this.#activeCollisions.has(collisionKey)) {
        this.#activeCollisions.set(collisionKey, 0);
        controllerEntity.fire(
          EntityCollision,
          true,
          colliderEntity,
          controllerContactPoint,
          controllerNormal,
        );

        colliderEntity.fire(
          EntityCollision,
          true,
          controllerEntity,
          colliderContactPoint,
          colliderNormal,
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
          // Remove collision after 2 missing ticks
          this.#activeCollisions.delete(key);
          // Could fire end collision event here if needed
        } else {
          this.#activeCollisions.set(key, newMissingTicks);
        }
      }
    }
  }

  shutdown() {
    this.world.free();
    this.#events.free();
  }
}
