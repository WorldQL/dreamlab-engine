// @deno-types="npm:@types/matter-js"
import Matter from "npm:matter-js"; // probably rapier in reality

import { Entity, EntityContext } from "./entity.ts";

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
  }

  // look at game.ts to see the reason here
  onPreUpdate(): void {
    Matter.Body.setPosition(
      this.body,
      Matter.Vector.create(
        this.globalTransform.position.x,
        this.globalTransform.position.y
      )
    );
    Matter.Body.setAngle(this.body, this.globalTransform.rotation);
  }

  onUpdate(): void {
    this.globalTransform.position.x = this.body.position.x;
    this.globalTransform.position.y = this.body.position.y;
    this.globalTransform.rotation = this.body.angle;
  }
}
Entity.register(Rigidbody2D, "@core");
