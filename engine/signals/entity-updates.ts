import { Entity } from "../entity/mod.ts";
import { BaseGame } from "../game.ts";
import { Vector2 } from "../math/mod.ts";
import { ConnectionId } from "../network.ts";
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
  constructor(
    public before: Vector2,
    public current: Vector2,
  ) {}
  [exclusiveSignalType] = Entity;
}
export class EntityResize {
  constructor(
    public before: Vector2,
    public current: Vector2,
  ) {}
  [exclusiveSignalType] = Entity;
}
export class EntityRotate {
  constructor(
    public before: number,
    public current: number,
  ) {}
  [exclusiveSignalType] = Entity;
}
export class EntityZChanged {
  constructor(
    public before: number,
    public current: number,
  ) {}
  [exclusiveSignalType] = Entity;
}

export class EntityExclusiveAuthorityChanged {
  constructor(
    public entity: Entity,
    public authority: ConnectionId | undefined,
    public clock: number,
  ) {}
  [exclusiveSignalType] = BaseGame;
}
