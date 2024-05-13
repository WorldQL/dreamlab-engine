import { Entity } from "../entity.ts";

export class EntitySpawned {}
export class EntityChildSpawned {
  constructor(public child: Entity) {}
}
export class EntityDescendentSpawned {
  constructor(public descendent: Entity) {}
}

export class EntityDestroyed {}
export class EntityChildDestroyed {
  constructor(public child: Entity) {}
}
export class EntityDescendentDestroyed {
  constructor(public descendent: Entity) {}
}
