import { Entity } from "./entity.ts";
import { Game } from "./game.ts";

export class EntityStore {
  game: Game;

  #entitiesById = new Map<string, Entity>();
  #entitiesByUid = new Map<string, Entity>();

  constructor(game: Game) {
    this.game = game;
  }

  lookupById(id: string): Entity | undefined {
    return this.#entitiesById.get(id);
  }

  lookupByUid(uid: string): Entity | undefined {
    return this.#entitiesByUid.get(uid);
  }

  /** for internal use */
  _register(entity: Entity, oldId?: string) {
    if (oldId && this.#entitiesById.get(oldId) === entity)
      this.#entitiesById.delete(oldId);

    this.#entitiesByUid.set(entity.uid, entity);
    this.#entitiesById.set(entity.id, entity);
  }
  /** for internal use */
  _unregister(entity: Entity) {
    this.#entitiesById.delete(entity.id);
    this.#entitiesByUid.delete(entity.uid);
  }
}
