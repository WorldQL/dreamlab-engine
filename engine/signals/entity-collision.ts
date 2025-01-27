import { Entity } from "@dreamlab/engine";
import { Vector2 } from "@dreamlab/engine";
import { exclusiveSignalType } from "@dreamlab/engine";

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
