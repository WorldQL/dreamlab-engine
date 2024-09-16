import RAPIER from "@dreamlab/vendor/rapier.ts";
import * as internal from "../../internal.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { EntityDestroyed } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

export class RectCollider extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "🧱";
  get bounds(): Readonly<IVector2> | undefined {
    // controlled by globalTransform
    return { x: 1, y: 1 };
  }

  #internal: { collider: RAPIER.Collider; shape: RAPIER.Cuboid } | undefined;

  isSensor: boolean = false;

  get collider(): RAPIER.Collider {
    if (!this.#internal) throw new Error("attempted to access .collider on a prefab object");
    return this.#internal.collider;
  }

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValue(RectCollider, "isSensor");

    if (this.root !== this.game.prefabs) {
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
      collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
      const shape = collider.shape as RAPIER.Cuboid;
      collider.setSensor(this.isSensor);

      this.#internal = { collider, shape };
    }

    this.on(EntityDestroyed, () => {
      if (this.#internal) {
        this.game.physics.world.removeCollider(this.#internal.collider, false);
        this.#internal = undefined;
      }
    });
  }

  [internal.interpolationStartTick](): void {
    super[internal.interpolationStartTick]();
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
