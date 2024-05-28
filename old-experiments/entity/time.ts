import type { ClientGame } from "../runtime/client/client_game.ts";

export interface Time {
  readonly time: number;

  readonly delta: number;
}

export interface RenderTime extends Time {
  readonly game: ClientGame;

  readonly smooth: number;
}
