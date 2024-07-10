import RAPIER from "@dreamlab/vendor/rapier.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityPreUpdate, EntityUpdate } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

export class RectCollider2D extends Entity {
  public static readonly icon = "⬜";

  collider: RAPIER.Collider;
  #shape: RAPIER.Cuboid;

  constructor(ctx: EntityContext) {
    super(ctx);

    const desc = RAPIER.ColliderDesc.cuboid(
      this.globalTransform.scale.x / 2,
      this.globalTransform.scale.y / 2,
    )
      .setTranslation(this.globalTransform.position.x, this.globalTransform.position.y)
      .setRotation(this.globalTransform.rotation);

    this.collider = this.game.physics.world.createCollider(desc);
    this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    this.#shape = this.collider.shape as RAPIER.Cuboid;

    // EntityPreUpdate happens before physics runs, so we can set the physics body to match our transform
    this.on(EntityPreUpdate, () => {
      if (!this.game.physics.enabled) return;

      this.collider.setTranslation({
        x: this.globalTransform.position.x,
        y: this.globalTransform.position.y,
      });
      this.collider.setRotation(this.globalTransform.rotation);
      this.#shape.halfExtents = {
        x: this.globalTransform.scale.x / 2,
        y: this.globalTransform.scale.y / 2,
      };
    });

    // EntityUpdate happens after physics runs, so we can update our transform
    // to reflect the movement of the physics body
    this.on(EntityUpdate, () => {
      if (!this.game.physics.enabled) return;

      this.globalTransform.position = new Vector2(this.collider.translation());
      this.globalTransform.rotation = this.collider.rotation();
      this.globalTransform.scale = new Vector2(
        this.#shape.halfExtents.x * 2,
        this.#shape.halfExtents.y * 2,
      );
    });
  }
}
Entity.registerType(RectCollider2D, "@core");
