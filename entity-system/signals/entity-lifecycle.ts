import { Entity } from "../entity.ts";
import { exclusiveSignalType } from "../signals.ts";

export class EntitySpawned {
  [exclusiveSignalType] = Entity;
}
export class EntityChildSpawned {
  constructor(public child: Entity) {}
  [exclusiveSignalType] = Entity;
}
export class EntityDescendentSpawned {
  constructor(public descendent: Entity) {}
  [exclusiveSignalType] = Entity;
}

export class EntityDestroyed {
  [exclusiveSignalType] = Entity;
}
export class EntityChildDestroyed {
  constructor(public child: Entity) {}
  [exclusiveSignalType] = Entity;
}
export class EntityDescendentDestroyed {
  constructor(public descendent: Entity) {}
  [exclusiveSignalType] = Entity;
}
