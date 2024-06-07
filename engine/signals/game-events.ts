import { BaseGame } from "../game.ts";
import { exclusiveSignalType } from "../signal.ts";

export class GameTick {
  [exclusiveSignalType] = BaseGame;
}
export class GamePreRender {
  constructor(public delta: number) {}
  [exclusiveSignalType] = BaseGame;
}
export class GameRender {
  constructor(public delta: number) {}
  [exclusiveSignalType] = BaseGame;
}
export class GameShutdown {
  [exclusiveSignalType] = BaseGame;
}
