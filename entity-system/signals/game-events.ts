import { BaseGame } from "../game.ts";
import { ExclusiveSignal, exclusiveSignalType } from "../signals.ts";

export class GameTick {}
export class GameRender implements ExclusiveSignal<BaseGame> {
  constructor(public delta: number) {}
  [exclusiveSignalType]() {
    return BaseGame;
  }
}
export class GameShutdown {}
