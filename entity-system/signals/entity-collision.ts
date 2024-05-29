import { Entity } from "../entity.ts";
import { exclusiveSignalType } from "../signals.ts";

export class EntityCollision {
  constructor(public started: boolean, public other: Entity) {}
  [exclusiveSignalType] = Entity;
}
