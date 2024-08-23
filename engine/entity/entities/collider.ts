import RAPIER from "@dreamlab/vendor/rapier.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { EntityDestroyed, EntityPreUpdate, EntityUpdate } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

export class RectCollider2D extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "⬜";
  get bounds(): Readonly<IVector2> | undefined {
    // controlled by globalTransform
    return { x: 1, y: 1 };
  }

  #internal: { collider: RAPIER.Collider; shape: RAPIER.Cuboid } | undefined;

  get collider(): RAPIER.Collider {
    if (!this.#internal) throw new Error("attempted to access .collider on a prefab object");
    return this.#internal.collider;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    if (this.root !== this.game.prefabs) {
      const desc = RAPIER.ColliderDesc.cuboid(
        this.globalTransform.scale.x / 2,
        this.globalTransform.scale.y / 2,
      )
        .setTranslation(this.globalTransform.position.x, this.globalTransform.position.y)
        .setRotation(this.globalTransform.rotation);

      const collider = this.game.physics.world.createCollider(desc);
      collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
      const shape = collider.shape as RAPIER.Cuboid;

      this.#internal = { collider, shape };
    }

    // EntityPreUpdate happens before physics runs, so we can set the physics body to match our transform
    this.on(EntityPreUpdate, () => {
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
    });

    // EntityUpdate happens after physics runs, so we can update our transform
    // to reflect the movement of the physics body
    this.on(EntityUpdate, () => {
      if (!this.game.physics.enabled) return;
      if (!this.#internal) return;

      this.globalTransform.position = new Vector2(this.#internal.collider.translation());
      this.globalTransform.rotation = this.#internal.collider.rotation();
      this.globalTransform.scale = new Vector2(
        this.#internal.shape.halfExtents.x * 2,
        this.#internal.shape.halfExtents.y * 2,
      );
    });

    this.on(EntityDestroyed, () => {
      if (this.#internal) {
        this.game.physics.world.removeCollider(this.#internal.collider, false);
      }
    });
  }
}
