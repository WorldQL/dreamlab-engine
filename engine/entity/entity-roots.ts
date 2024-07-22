import * as internal from "../internal.ts";
import { Entity } from "./entity.ts";
import { Game } from "../game.ts";

export class WorldRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "world" });

    game.entities._unregister(this);

    this.name = "game.world";
    // @ts-expect-error assign readonly id
    this.id = "game.world";
    // @ts-expect-error assign readonly ref
    this.ref = "WORLD";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class ServerRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "server" });

    game.entities._unregister(this);

    this.name = "game.server";
    // @ts-expect-error assign readonly id
    this.id = "game.server";
    // @ts-expect-error assign readonly ref
    this.ref = "SERVER";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class LocalRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "local" });

    game.entities._unregister(this);

    this.name = "game.local";
    // @ts-expect-error assign readonly id
    this.id = "game.local";
    // @ts-expect-error assign readonly ref
    this.ref = "LOCAL";

    this.pausable = false;

    game.entities._register(this);
  }
}

export class PrefabsRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "prefabs" });

    game.entities._unregister(this);

    this.name = "game.prefabs";
    // @ts-expect-error assign readonly id
    this.id = "game.prefabs";
    // @ts-expect-error assign readonly ref
    this.ref = "PREFABS";

    this.pausable = false;

    game.entities._register(this);
  }
}
