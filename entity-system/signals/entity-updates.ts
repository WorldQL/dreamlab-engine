import { Entity } from "../entity.ts";
import { Vector2 } from "../math.ts";
import { exclusiveSignalType } from "../signals.ts";

export class EntityPreUpdate {
  [exclusiveSignalType] = Entity;
}

export class EntityUpdate {
  [exclusiveSignalType] = Entity;
}

export class EntityMove {
  constructor(public before: Vector2, public current: Vector2) {}
  [exclusiveSignalType] = Entity;
}
export class EntityResize {
  constructor(public before: Vector2, public current: Vector2) {}
  [exclusiveSignalType] = Entity;
}
export class EntityRotate {
  constructor(public before: number, public current: number) {}
  [exclusiveSignalType] = Entity;
}
