import { Vector2 } from "../math.ts";

export class EntityPreUpdate {}
export class EntityUpdate {}

export class EntityMove {
  before: Vector2;
  now: Vector2;
  constructor(before: Vector2, current: Vector2) {
    this.before = before;
    this.now = current;
  }
}
export class EntityResize {
  before: Vector2;
  now: Vector2;
  constructor(before: Vector2, current: Vector2) {
    this.before = before;
    this.now = current;
  }
}
export class EntityRotate {
  before: number;
  now: number;
  constructor(before: number, current: number) {
    this.before = before;
    this.now = current;
  }
}
