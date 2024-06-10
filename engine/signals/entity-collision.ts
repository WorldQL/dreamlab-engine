import { Entity } from "../entity/mod.ts";
import { exclusiveSignalType } from "../signal.ts";

export class EntityCollision {
  constructor(
    public started: boolean,
    public other: Entity,
  ) {}
  [exclusiveSignalType] = Entity;
}
