import type { Game } from "../game.ts";
import * as internal from "../internal.ts";
import { EntityStore } from "./entity-store.ts";
import { Entity } from "./entity.ts";

export abstract class Root extends Entity {
  static [internal.internalEntity] = true;

  readonly entities: EntityStore;
  readonly bounds: undefined;

  constructor(game: Game, name: string) {
    super({ game, name, ref: name.toUpperCase() });

    this.entities = new EntityStore();
    game.entities[internal.entityStoreRegisterRoot](`game.${name}`, this.entities);
    game.entities[internal.entityStoreUnregister](this);

    this.name = `game.${name}`;
    // @ts-expect-error assign readonly id
    this.id = `game.${name}`;
    // @ts-expect-error assign readonly id
    this.root = this;

    game.entities[internal.entityStoreRegister](this);

    this[internal.entitySpawnFinalize]();
  }
}

export class WorldRoot extends Root {
  constructor(game: Game) {
    super(game, "world");
  }
}

export class ServerRoot extends Root {
  constructor(game: Game) {
    super(game, "server");
  }
}

export class LocalRoot extends Root {
  constructor(game: Game) {
    super(game, "local");
  }
}

export class PrefabsRoot extends Root {
  constructor(game: Game) {
    super(game, "prefabs");
  }
}
