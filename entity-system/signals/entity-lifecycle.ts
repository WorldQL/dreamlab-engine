import { Entity } from "../entity.ts";

export class EntitySpawned {}
export class EntityChildSpawned {
  child: Entity;
  constructor(child: Entity) {
    this.child = child;
  }
}
export class EntityDescendentSpawned {
  descendent: Entity;
  constructor(child: Entity) {
    this.descendent = child;
  }
}

export class EntityDestroyed {}
export class EntityChildDestroyed {
  child: Entity;
  constructor(child: Entity) {
    this.child = child;
  }
}
export class EntityDescendentDestroyed {
  descendent: Entity;
  constructor(child: Entity) {
    this.descendent = child;
  }
}
