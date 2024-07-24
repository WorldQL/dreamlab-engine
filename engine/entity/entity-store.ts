import {
  entityStoreRegister,
  entityStoreRegisterRoot,
  entityStoreUnregister,
} from "../internal.ts";
import { IVector2, pointWorldToLocal } from "../math/mod.ts";
import { Entity, EntityConstructor } from "./entity.ts";

export class EntityStore {
  #entitiesById = new Map<string, Entity>();
  #entitiesByRef = new Map<string, Entity>();
  #entitiesByType = new Map<EntityConstructor, Set<Entity>>();

  get all(): IterableIterator<Entity> {
    return this.#entitiesById.values();
  }

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

  lookupByPosition(position: IVector2): readonly Entity[] {
    const entities: Entity[] = [];
    for (const entity of this.#entitiesById.values()) {
      const bounds = entity.bounds;
      if (!bounds) continue;

      const local = pointWorldToLocal(entity.globalTransform, position);
      const inBounds =
        local.x >= bounds.x / -2 &&
        local.x <= bounds.x / 2 &&
        local.y >= bounds.y / -2 &&
        local.y <= bounds.y / 2;

      if (inBounds) entities.push(entity);
    }
    return entities;
  }

  // #region Internal methods
  [entityStoreRegister](entity: Entity, oldId?: string) {
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

    if (entity.root) {
      this.#roots.get(entity.root.name)?.[entityStoreRegister](entity, oldId);
    }
  }

  [entityStoreUnregister](entity: Entity) {
    this.#entitiesById.delete(entity.id);
    this.#entitiesByRef.delete(entity.ref);

    const type = entity.constructor as EntityConstructor;
    const set = this.#entitiesByType.get(type);
    if (set) set.delete(entity);

    if (entity.root) {
      this.#roots.get(entity.root.name)?.[entityStoreUnregister](entity);
    }
  }

  #roots = new Map<string, EntityStore>();
  [entityStoreRegisterRoot](root: string, store: EntityStore) {
    this.#roots.set(root, store);
  }
  // #endregion
}
