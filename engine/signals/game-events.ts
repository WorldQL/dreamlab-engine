import { BaseGame } from "../game.ts";
import { exclusiveSignalType } from "../signal.ts";

export class GamePreTick {
  [exclusiveSignalType] = BaseGame;
}
export class GameTick {
  [exclusiveSignalType] = BaseGame;
}
export class GameShouldUpdateCursorPosition {
  [exclusiveSignalType] = BaseGame;
}
export class GamePostTick {
  [exclusiveSignalType] = BaseGame;
}

export class GamePreRender {
  [exclusiveSignalType] = BaseGame;
}
export class GameRender {
  [exclusiveSignalType] = BaseGame;
}
export class GamePostRender {
  [exclusiveSignalType] = BaseGame;
}

export class GameShutdown {
  [exclusiveSignalType] = BaseGame;
}
export class GameStatusChange {
  [exclusiveSignalType] = BaseGame;
}
