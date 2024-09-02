import { BaseGame } from "../game.ts";
import { exclusiveSignalType } from "../signal.ts";

export class GamePreTick {
  static __singleton = new this();
  [exclusiveSignalType] = BaseGame;
}
export class GameTick {
  static __singleton = new this();
  [exclusiveSignalType] = BaseGame;
}
export class GamePostTick {
  static __singleton = new this();
  [exclusiveSignalType] = BaseGame;
}

export class GamePreRender {
  static __singleton = new this();
  [exclusiveSignalType] = BaseGame;
}
export class GameRender {
  static __singleton = new this();
  [exclusiveSignalType] = BaseGame;
}
export class GamePostRender {
  static __singleton = new this();
  [exclusiveSignalType] = BaseGame;
}

export class GameShutdown {
  [exclusiveSignalType] = BaseGame;
}
export class GameStatusChange {
  [exclusiveSignalType] = BaseGame;
}
