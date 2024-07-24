import type { Game } from "../game.ts";
import * as internal from "../internal.ts";
import { EntityStore } from "./entity-store.ts";
import { Entity } from "./entity.ts";

export class WorldRoot extends Entity {
  static [internal.internalEntity] = true;

  readonly entities: EntityStore;

  constructor(game: Game) {
    super({ game, name: "world", ref: "WORLD" });

    this.entities = new EntityStore();
    game.entities._registerRoot("world", this.entities);

    game.entities._unregister(this);

    this.name = "game.world";
    // @ts-expect-error assign readonly id
    this.id = "game.world";
    // @ts-expect-error assign readonly id
    this.root = "world";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class ServerRoot extends Entity {
  static [internal.internalEntity] = true;

  readonly entities: EntityStore;

  constructor(game: Game) {
    super({ game, name: "server", ref: "SERVER" });

    this.entities = new EntityStore();
    game.entities._registerRoot("server", this.entities);

    game.entities._unregister(this);

    this.name = "game.server";
    // @ts-expect-error assign readonly id
    this.id = "game.server";
    // @ts-expect-error assign readonly id
    this.root = "server";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class LocalRoot extends Entity {
  static [internal.internalEntity] = true;

  readonly entities: EntityStore;

  constructor(game: Game) {
    super({ game, name: "local", ref: "LOCAL" });

    this.entities = new EntityStore();
    game.entities._registerRoot("local", this.entities);

    game.entities._unregister(this);

    this.name = "game.local";
    // @ts-expect-error assign readonly id
    this.id = "game.local";
    // @ts-expect-error assign readonly id
    this.root = "local";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class PrefabsRoot extends Entity {
  static [internal.internalEntity] = true;

  readonly entities: EntityStore;

  constructor(game: Game) {
    super({ game, name: "prefabs", ref: "PREFABS" });

    this.entities = new EntityStore();
    game.entities._registerRoot("prefabs", this.entities);

    game.entities._unregister(this);

    this.name = "game.prefabs";
    // @ts-expect-error assign readonly id
    this.id = "game.prefabs";
    // @ts-expect-error assign readonly id
    this.root = "prefabs";

    this.pausable = false;

    game.entities._register(this);
  }
}
