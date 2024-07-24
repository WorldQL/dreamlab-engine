import * as internal from "../internal.ts";
import { Entity } from "./entity.ts";
import { Game } from "../game.ts";

export class WorldRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "world", ref: "WORLD" });

    game.entities._unregister(this);

    this.name = "game.world";
    // @ts-expect-error assign readonly id
    this.id = "game.world";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class ServerRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "server", ref: "SERVER" });

    game.entities._unregister(this);

    this.name = "game.server";
    // @ts-expect-error assign readonly id
    this.id = "game.server";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class LocalRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "local", ref: "LOCAL" });

    game.entities._unregister(this);

    this.name = "game.local";
    // @ts-expect-error assign readonly id
    this.id = "game.local";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class PrefabsRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "prefabs", ref: "PREFABS" });

    game.entities._unregister(this);

    this.name = "game.prefabs";
    // @ts-expect-error assign readonly id
    this.id = "game.prefabs";

    this.pausable = false;

    game.entities._register(this);
  }
}
