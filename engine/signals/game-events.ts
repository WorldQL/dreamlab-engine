import { BaseGame, exclusiveSignalType } from "@dreamlab/engine";

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

// export class GamePreRender {
//   static __singleton = new this();
//   [exclusiveSignalType] = BaseGame;
// }
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

export class InternalGameTick {
  // fired even when game is paused
  static __singleton = new this();
  [exclusiveSignalType] = BaseGame;
}

export class GameRenderResize {
  static __singleton = new this();
  [exclusiveSignalType] = BaseGame;
}

export class EditorChangeRequiresRestart {
  constructor(public reason: string) {}
  [exclusiveSignalType] = BaseGame;
}

export class EditorChangeRestartCleared {
  constructor(public reason: string) {}
  [exclusiveSignalType] = BaseGame;
}
