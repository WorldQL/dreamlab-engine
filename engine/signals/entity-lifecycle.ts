import type { ConnectionId, EntityDefinition } from "@dreamlab/engine";
import { BaseGame, Entity, exclusiveSignalType } from "@dreamlab/engine";

// this could be called "EntitySpawned" if we obliterated all the other ones.
// that would be a breaking change though
export class EntitySpawnOperation {
  constructor(
    public entity: Entity,
    public definition: EntityDefinition,
    public from: ConnectionId,
  ) {}
  [exclusiveSignalType] = BaseGame;
}

// this could be "EntityDestroyed"
export class EntityDestroyOperation {
  constructor(
    public entity: Entity,
    public from: ConnectionId,
  ) {}
  [exclusiveSignalType] = BaseGame;
}

/**
 * Fired when this entity spawns in for the first time -- Only really useful
 * from within onInitialize(..) or an Entity constructor
 */
export class EntitySpawned {
  [exclusiveSignalType] = Entity;
}
/**
 * Fired when a child appears beneath this entity.
 * For deep hierarchy additions see {@link EntityDescendantSpawned}
 *
 * @see EntityChildDestroyed
 */
export class EntityChildSpawned {
  constructor(public child: Entity) {}
  [exclusiveSignalType] = Entity;
}
/**
 * Fired when a child or grandchild or nth descendant appears beneath this entity.
 * Covers all cases of {@link EntityChildSpawned} with additions.
 */
export class EntityDescendantSpawned {
  constructor(public descendant: Entity) {}
  [exclusiveSignalType] = Entity;
}

/**
 * Fired when this entity is destroyed.
 */
export class EntityDestroyed {
  constructor(public parentDestroyed: boolean) {}

  [exclusiveSignalType] = Entity;
}
/**
 * Fired when a child of this entity is destroyed.
 */
export class EntityChildDestroyed {
  constructor(
    public child: Entity,
    public parentDestroyed: boolean,
  ) {}
  [exclusiveSignalType] = Entity;
}
/**
 * Fired when a descendant of this entity is destroyed.
 */
export class EntityDescendantDestroyed {
  constructor(
    public descendant: Entity,
    public parentDestroyed: boolean,
  ) {}
  [exclusiveSignalType] = Entity;
}

/**
 * Fired when this entity's {@link Entity#name} changes.
 */
export class EntityRenamed {
  constructor(public oldName: string) {}
  [exclusiveSignalType] = Entity;
}

export class EntityChildRenamed {
  constructor(
    public child: Entity,
    public oldName: string,
  ) {}
  [exclusiveSignalType] = Entity;
}

export class EntityDescendantRenamed {
  constructor(
    public descendant: Entity,
    public oldName: string,
  ) {}
  [exclusiveSignalType] = Entity;
}

/**
 * Fired when this entity's {@link Entity#parent} changes.
 */
export class EntityReparented {
  constructor(public oldParent: Entity) {}
  [exclusiveSignalType] = Entity;
}

export class EntityChildReparented {
  constructor(
    public child: Entity,
    public oldParent: Entity,
  ) {}
  [exclusiveSignalType] = Entity;
}

export class EntityDescendantReparented {
  constructor(
    public descendant: Entity,
    public oldParent: Entity,
  ) {}
  [exclusiveSignalType] = Entity;
}

// for performance, uses Game as the event bus
export class EntityHierarchyChanged {
  constructor(
    public entity: Entity,
    public oldParent: Entity,
    public newParent: Entity,
  ) {}
  [exclusiveSignalType] = BaseGame;
}

export class EntityOwnEnableChanged {
  constructor(public enabled: boolean) {}
  [exclusiveSignalType] = Entity;
}

export class EntityEnableChanged {
  constructor(public enabled: boolean) {}
  [exclusiveSignalType] = Entity;
}

// for performance, uses Game as the event bus
export class AnyEntityOwnEnableChanged {
  constructor(
    public entity: Entity,
    public enabled: boolean,
  ) {}
  [exclusiveSignalType] = BaseGame;
}
