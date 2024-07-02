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

    this.name = "game.server";
    // @ts-expect-error assign readonly id
    this.id = "game.server";
    // @ts-expect-error assign readonly ref
    this.ref = "SERVER";

    this.pausable = false;
  }
}

export class LocalRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "local" });

    this.name = "game.local";
    // @ts-expect-error assign readonly id
    this.id = "game.local";
    // @ts-expect-error assign readonly ref
    this.ref = "LOCAL";

    this.pausable = false;
  }
}

export class PrefabsRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "prefabs" });

    this.name = "game.prefabs";
    // @ts-expect-error assign readonly id
    this.id = "game.prefabs";
    // @ts-expect-error assign readonly ref
    this.ref = "PREFABS";

    this.pausable = false;
  }
}
