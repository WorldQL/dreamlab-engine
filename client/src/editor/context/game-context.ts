import { ClientGame } from "@dreamlab/engine";
// @deno-types=npm:@types/react@18.3.1
import { createContext, useContext } from "react";

export const GameContext = createContext<ClientGame | undefined>(undefined);
export const useGame = (): ClientGame => {
  const game = useContext(GameContext);
  if (game === undefined) throw new Error("No game was present!");
  return game;
};
