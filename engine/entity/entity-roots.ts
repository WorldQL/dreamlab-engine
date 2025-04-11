import type { Game } from "@dreamlab/engine";
import { Entity, EntityStore } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

export abstract class Root extends Entity {
  static [internal.internalEntity] = true;

  readonly entities: EntityStore;
  readonly bounds: undefined;

  constructor(game: Game, name: string, icon: string) {
    super({ game, name, ref: name.toUpperCase() });

    this.entities = new EntityStore();
    game.entities[internal.entityStoreRegisterRoot](name, this.entities);
    game.entities[internal.entityStoreUnregister](this);

    this.name = name;
    // @ts-expect-error assign readonly id
    this.id = name;
    // @ts-expect-error assign readonly id
    this.root = this;

    //FIXME: this doesnt work
    this.icon = icon;

    game.entities[internal.entityStoreRegister](this);

    this[internal.entitySpawnFinalize1]();
    this[internal.entitySpawnFinalize2]();
  }
}

export class WorldRoot extends Root {
  constructor(game: Game) {
    super(game, "world", "🌐");
  }
}

export class ServerRoot extends Root {
  constructor(game: Game) {
    super(game, "server", "📡");
  }
}

export class LocalRoot extends Root {
  constructor(game: Game) {
    super(game, "local", "💻");
  }
}

export class PrefabsRoot extends Root {
  constructor(game: Game) {
    super(game, "prefabs", "📝");

    this.enabled = false;
  }
}
