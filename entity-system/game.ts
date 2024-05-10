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

  physics = {
    update() {
      // you get the idea
    },
  };

  constructor() {
    if (!(this instanceof ServerGame || this instanceof ClientGame))
      throw new Error("BaseGame is sealed to ServerGame and ClientGame!");
  }

  tick() {
    // run the pre tick phase, then a physics update, then the tick phase
    // so e.g. in Rigidbody2D we can move the body to the entity's transform,
    // have the physics world update, and then move the transform to the new position of the body.

    this[internal.preTickEntities]();
    this.physics.update();
    this[internal.tickEntities]();
  }

  [internal.preTickEntities]() {
    this.world[internal.preTickEntities]();
  }

  [internal.tickEntities]() {
    this.world[internal.tickEntities]();
  }
}

export class ServerGame extends BaseGame {
  remote: RemoteRoot = new RemoteRoot(this);
  local: undefined;

  [internal.preTickEntities]() {
    super[internal.preTickEntities]();
    this.remote[internal.preTickEntities]();
  }

  [internal.tickEntities]() {
    super[internal.tickEntities]();
    this.remote[internal.tickEntities]();
  }
}

export class ClientGame extends BaseGame {
  local: LocalRoot = new LocalRoot(this);
  remote: undefined;

  [internal.preTickEntities]() {
    super[internal.preTickEntities]();
    this.local[internal.preTickEntities]();
  }

  [internal.tickEntities]() {
    super[internal.tickEntities]();
    this.local[internal.tickEntities]();
  }
}

export type Game = ServerGame | ClientGame;
