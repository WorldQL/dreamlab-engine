import { Entity } from "../entity/mod.ts";
import { exclusiveSignalType } from "../signal.ts";

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
