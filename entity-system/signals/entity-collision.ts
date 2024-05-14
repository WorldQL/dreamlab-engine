import { Entity } from "../entity.ts";

export class EntityCollision {
  constructor(public started: boolean, public other: Entity) {}
}
