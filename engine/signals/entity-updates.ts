import { Entity } from "../entity/mod.ts";
import { BaseGame } from "../game.ts";
import { ConnectionId } from "../network.ts";
import { exclusiveSignalType } from "../signal.ts";

export class EntityTransformUpdate {
  /**
   * @param source the entity that originated this transform update (the entity itself or an ancestor)
   */
  constructor(public source: Entity) {}
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
