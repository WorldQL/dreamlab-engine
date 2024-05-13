import { Vector2 } from "../math.ts";

export class EntityPreUpdate {}
export class EntityUpdate {}

export class EntityMove {
  constructor(public before: Vector2, public current: Vector2) {}
}
export class EntityResize {
  constructor(public before: Vector2, public current: Vector2) {}
}
export class EntityRotate {
  constructor(public before: number, public current: number) {}
}
