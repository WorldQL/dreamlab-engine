import * as internal from "../internal.ts";
import { Entity } from "./entity.ts";
import { Game } from "../game.ts";

export class WorldRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "world" });

    this.name = "game.world";
    // @ts-expect-error assign readonly id
    this.id = "game.world";
    // @ts-expect-error assign readonly ref
    this.ref = "WORLD";
  }
}

export class RemoteRoot extends Entity {
  static [internal.internalEntity] = true;

  constructor(game: Game) {
    super({ game, name: "remote" });

    this.name = "game.remote";
    // @ts-expect-error assign readonly id
    this.id = "game.remote";
    // @ts-expect-error assign readonly ref
    this.ref = "REMOTE";
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
  }
}
