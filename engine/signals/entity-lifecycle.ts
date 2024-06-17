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
 * For deep hierarchy additions see {@link EntityDescendentSpawned}
 *
 * @see EntityChildDestroyed
 */
export class EntityChildSpawned {
  constructor(public child: Entity) {}
  [exclusiveSignalType] = Entity;
}
/**
 * Fired when a child or grandchild or nth descendent appears beneath this entity.
 * Covers all cases of {@link EntityChildSpawned} with additions.
 */
export class EntityDescendentSpawned {
  constructor(public descendent: Entity) {}
  [exclusiveSignalType] = Entity;
}

/**
 * Fired when this entity is destroyed.
 */
export class EntityDestroyed {
  [exclusiveSignalType] = Entity;
}
/**
 * Fired when a child of this entity is destroyed.
 */
export class EntityChildDestroyed {
  constructor(public child: Entity) {}
  [exclusiveSignalType] = Entity;
}
/**
 * Fired when a descendent of this entity is destroyed.
 */
export class EntityDescendentDestroyed {
  constructor(public descendent: Entity) {}
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

export class EntityDescendentRenamed {
  constructor(
    public descendent: Entity,
    public oldName: string,
  ) {}
  [exclusiveSignalType] = Entity;
}
