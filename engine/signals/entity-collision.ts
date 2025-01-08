import { Entity } from "../entity/mod.ts";
import { Vector2 } from "../math/vector/vector2.ts";
import { exclusiveSignalType } from "../signal.ts";

export class EntityCollision {
  constructor(
    public readonly started: boolean,
    public readonly other: Entity,
    /**
     * Point of contact in world space.
     */
    public readonly contactPoint: Vector2,
    /**
     * Normal vector in world space.
     */
    public readonly normal: Vector2,
  ) {}
  [exclusiveSignalType] = Entity;
}
