import {
  LocalRoot,
  PrefabsRoot,
  RemoteRoot,
  WorldRoot,
} from "./entity-roots.ts";
import * as internal from "./internal.ts";

abstract class BaseGame {
  world: WorldRoot = new WorldRoot(this as unknown as Game);
  prefabs: PrefabsRoot = new PrefabsRoot(this as unknown as Game);

  constructor() {
    if (!(this instanceof ServerGame || this instanceof ClientGame))
      throw new Error("BaseGame is sealed to ServerGame and ClientGame!");
  }

  tick() {
    this.world[internal.preTickEntities]();
    this.world[internal.tickEntities]();
  }
}

export class ServerGame extends BaseGame {
  remote: RemoteRoot = new RemoteRoot(this);
  local: undefined;

  tick(): void {
    super.tick();

    this.remote[internal.preTickEntities]();
    this.remote[internal.tickEntities]();
  }
}

export class ClientGame extends BaseGame {
  local: LocalRoot = new LocalRoot(this);
  remote: undefined;

  tick(): void {
    super.tick();

    this.local[internal.preTickEntities]();
    this.local[internal.tickEntities]();
  }
}

export type Game = ServerGame | ClientGame;
