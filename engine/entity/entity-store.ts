import { Entity, EntityConstructor } from "./entity.ts";

export class EntityStore {
  #entitiesById = new Map<string, Entity>();
  #entitiesByRef = new Map<string, Entity>();
  #entitiesByType = new Map<EntityConstructor, Set<Entity>>();

  lookupById(id: string): Entity | undefined {
    return this.#entitiesById.get(id);
  }

  lookupByRef(ref: string): Entity | undefined {
    return this.#entitiesByRef.get(ref);
  }

  lookupByType<T extends Entity>(type: EntityConstructor<T, true>): readonly T[] {
    const entities: T[] = [];
    for (const [ctor, set] of this.#entitiesByType) {
      // @ts-expect-error: i cant be bothered to typecast this
      if (!(ctor === type || ctor.prototype instanceof type)) continue;
      // @ts-expect-error: same as above
      entities.push(...set.values());
    }

    return entities;
  }

  /** for internal use */
  _register(entity: Entity, oldId?: string) {
    if (oldId && this.#entitiesById.get(oldId) === entity) this.#entitiesById.delete(oldId);

    const existingEntity = this.#entitiesByRef.get(entity.ref);
    if (existingEntity && existingEntity !== entity)
      throw new Error("tried to overwrite entity ref: " + entity.ref);

    this.#entitiesByRef.set(entity.ref, entity);
    this.#entitiesById.set(entity.id, entity);

    const type = entity.constructor as EntityConstructor;
    const set = this.#entitiesByType.get(type) ?? new Set();
    set.add(entity);

    this.#entitiesByType.set(type, set);

    this.#roots.get(entity.root)?._register(entity, oldId);
  }
  /** for internal use */
  _unregister(entity: Entity) {
    this.#entitiesById.delete(entity.id);
    this.#entitiesByRef.delete(entity.ref);

    const type = entity.constructor as EntityConstructor;
    const set = this.#entitiesByType.get(type);
    if (set) set.delete(entity);

    this.#roots.get(entity.root)?._unregister(entity);
  }

  #roots = new Map<string, EntityStore>();
  _registerRoot(root: string, store: EntityStore) {
    this.#roots.set(root, store);
  }
}
