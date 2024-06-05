import { Entity } from "../entity/mod.ts";
import { exclusiveSignalType } from "../signal.ts";

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

export class EntityRenamed {
  constructor(public oldName: string) {}
  [exclusiveSignalType] = Entity;
}
