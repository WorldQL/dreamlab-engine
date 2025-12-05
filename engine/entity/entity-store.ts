import type {
  Behavior,
  BehaviorConstructor,
  Entity,
  EntityConstructor,
  IVector2,
} from "@dreamlab/engine";
import { pointWorldToLocal, Vector2 } from "@dreamlab/engine";
import {
  entityStoreRegister,
  entityStoreRegisterRoot,
  entityStoreUnregister,
} from "@dreamlab/engine/internal";

export class EntityStore {
  #entitiesById = new Map<string, Entity>();
  #entitiesByRef = new Map<string, Entity>();
  #entitiesByType = new Map<EntityConstructor, Set<Entity>>();

  [Symbol.iterator](): IterableIterator<Entity> {
    return this.#entitiesById.values();
  }

  /**
   * @deprecated {@link EntityStore} has [Symbol.iterator]()
   */
  get all(): IterableIterator<Entity> {
    return this.#entitiesById.values();
  }

  get size(): number {
    return this.#entitiesById.size;
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

      let local = pointWorldToLocal(entity.globalTransform, position);
      if (bounds.offset !== undefined) {
        local = Vector2.sub(local, bounds.offset);
      }

      const inBounds =
        local.x >= bounds.width / -2 &&
        local.x <= bounds.width / 2 &&
        local.y >= bounds.height / -2 &&
        local.y <= bounds.height / 2;

      if (inBounds) entities.push(entity);
    }
    return entities;
  }

  lookupByBehavior<B extends Behavior>(behavior: BehaviorConstructor<B>): readonly Entity[] {
    const entities: Entity[] = [];
    for (const entity of this.#entitiesById.values()) {
      if (entity.behaviors.some(b => b instanceof behavior)) entities.push(entity);
    }
    return entities;
  }

  // #region Internal methods
  [entityStoreRegister](entity: Entity, oldId?: string): void {
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

  [entityStoreUnregister](entity: Entity): void {
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
  [entityStoreRegisterRoot](root: string, store: EntityStore): void {
    this.#roots.set(root, store);
  }
  // #endregion
}
