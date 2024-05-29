import { BaseGame } from "../game.ts";
import { exclusiveSignalType } from "../signals.ts";

export class GameTick {
  [exclusiveSignalType] = BaseGame;
}
export class GameRender {
  constructor(public delta: number) {}
  [exclusiveSignalType] = BaseGame;
}
export class GameShutdown {
  [exclusiveSignalType] = BaseGame;
}
