import type { BaseGame } from "./base_game.ts";
import type { ClientGame } from "./client/mod.ts";
import type { ServerGame } from "./server/mod.ts";

export type Game = BaseGame | ClientGame | ServerGame;

export * from "./base_game.ts";
export * from "./client/mod.ts";
export * from "./server/mod.ts";
