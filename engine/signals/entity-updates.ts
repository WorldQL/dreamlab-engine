import type { ConnectionId } from "@dreamlab/engine";
import { BaseGame, Entity, exclusiveSignalType } from "@dreamlab/engine";

export class EntityTransformUpdate {
  /**
   * @param source the entity that originated this transform update (the entity itself or an ancestor)
   */
  constructor(
    public source: Entity,
    public fromNetwork: ConnectionId | undefined,
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
