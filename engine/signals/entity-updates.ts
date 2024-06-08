import { Entity } from "../entity/mod.ts";
import { Vector2 } from "../math/mod.ts";
import { exclusiveSignalType } from "../signal.ts";

export class EntityPreUpdate {
  [exclusiveSignalType] = Entity;
}

export class EntityUpdate {
  [exclusiveSignalType] = Entity;
}

export class EntityTransformUpdate {
  constructor() {}
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
