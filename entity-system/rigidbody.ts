// @deno-types="npm:@types/matter-js"
import Matter from "npm:matter-js"; // probably rapier in reality

import { Entity, EntityContext } from "./entity.ts";
import { EntityPreUpdate, EntityUpdate } from "./signals/entity-updates.ts";

export class Rigidbody2D extends Entity {
  body: Matter.Body;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.body = Matter.Bodies.rectangle(
      this.globalTransform.position.x + this.globalTransform.scale.x / 2,
      this.globalTransform.position.y + this.globalTransform.scale.y / 2,
      this.globalTransform.scale.x,
      this.globalTransform.scale.y
    );

    // EntityPreUpdate happens before physics runs, so we can set the physics body to match our transform
    this.on(EntityPreUpdate, () => {
      Matter.Body.setPosition(
        this.body,
        Matter.Vector.create(
          this.globalTransform.position.x,
          this.globalTransform.position.y
        )
      );
      Matter.Body.setAngle(this.body, this.globalTransform.rotation);
    });

    // EntityUpdate happens after physics runs, so we can update our transform
    // to reflect the movement of the physics body
    this.on(EntityUpdate, () => {
      this.globalTransform.position.x = this.body.position.x;
      this.globalTransform.position.y = this.body.position.y;
      this.globalTransform.rotation = this.body.angle;
    });
  }
}
Entity.register(Rigidbody2D, "@core");
