import { atom, useAtomValue, useSetAtom } from "jotai";
import { Pause, Play, Rocket, Square } from "lucide-react";
import { memo } from "react";
import { isPausedAtom, isRunningAtom } from "../../context/editor-context.tsx";
import { IconButton } from "../ui/icon-button.tsx";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip.tsx";

const playAtom = atom(null, (_, set) => set(isRunningAtom, true));
const stopAtom = atom(null, (_, set) => {
  set(isRunningAtom, false);
  set(isPausedAtom, false);
});
const pauseAtom = atom(null, (_, set) => set(isPausedAtom, isPaused => !isPaused));

const PlaybackControls = () => {
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
            onClick={handlePlay}
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
            onClick={handlePause}
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
            onClick={handleStop}
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
