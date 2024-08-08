import { atom, useAtomValue, useSetAtom } from "jotai";
import { Pause, Play, Rocket, Square } from "lucide-react";
// @deno-types="npm:@types/react@18.3.1"
import { memo } from "react";
import { isPausedAtom, isRunningAtom } from "../../context/editor-context.tsx";
import { IconButton } from "../ui/icon-button.tsx";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip.tsx";
import { playModeGame } from "../../global-game.ts";
import { loadSceneDefinition, serializeSceneDefinition } from "@dreamlab/scene";
import { useGame } from "../../context/game-context.ts";

// TODO: Synchronize these with the actual game state.
const playAtom = atom(null, (_, set) => set(isRunningAtom, true));
const stopAtom = atom(null, (_, set) => {
  set(isRunningAtom, false);
  set(isPausedAtom, false);
});
const pauseAtom = atom(null, (_, set) => set(isPausedAtom, isPaused => !isPaused));

const PlaybackControls = () => {
  const game = useGame();
  const isRunning = useAtomValue(isRunningAtom);
  const isPaused = useAtomValue(isPausedAtom);

  const handlePlay = useSetAtom(playAtom);
  const handleStop = useSetAtom(stopAtom);
  const handlePause = useSetAtom(pauseAtom);

  return (
    <div className="flex space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            onClick={() => {
              const world = serializeSceneDefinition(game);
              console.log(JSON.stringify(world));
              // TODO(Charlotte): serialize game, create play mode game, switch viewport to play mode game.
              // we should be serializing from game.world._.EditorEntities so that we can populate game.local and stuff

              // this is complicated by multiplayer editing (we need to send a play request to the server
              // so that *it* can handle world serialization and boot its play-mode instance et cetera)

              // currentGame.paused = false;
              handlePlay();
            }}
            icon={Rocket}
            className="bg-green hover:bg-greenDark"
            disabled={isRunning}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Play Game</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            onClick={() => {
              playModeGame.paused = true;
              handlePause();
            }}
            icon={isPaused ? Play : Pause}
            className="bg-yellow hover:bg-yellowDark"
            disabled={!isRunning}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isPaused ? "Resume" : "Pause"} Game</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            onClick={() => {
              // TODO(Charlotte): switch viewport back to editor view

              game.paused = true;
              handleStop();
            }}
            icon={Square}
            className="bg-red hover:bg-redDark"
            disabled={!isRunning}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Stop Game</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

const PlaybackControlsMemo = memo(PlaybackControls);
export { PlaybackControlsMemo as PlaybackControls };
