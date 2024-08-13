import { ClientGame } from "@dreamlab/engine";
// @deno-types=npm:@types/react@18.3.1
import { createContext, useContext } from "react";

export interface GlobalGames {
  edit: ClientGame;
  play?: ClientGame;
}

// dont actually use this unless you are main.ts lol
let _theGlobalGames: GlobalGames;
export const _setGlobalGames = (games: GlobalGames) => {
  _theGlobalGames = games;
};

export const GameContext = createContext<GlobalGames | undefined>(undefined);
export const useGame = (): ClientGame => {
  const games = useContext(GameContext);
  if (games === undefined) throw new Error("No game context was present!");
  return games.edit;
};

export const usePlayModeGame = (): ClientGame | undefined => {
  const games = _theGlobalGames;
  if (games === undefined) throw new Error("No game context was present!");
  return games.play;
};

export const setPlayModeGame = (game: ClientGame | undefined) => {
  const games = _theGlobalGames;
  games.play = game;
};
