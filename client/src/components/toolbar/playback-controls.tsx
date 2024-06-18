import { atom, useAtomValue, useSetAtom } from "jotai";
import { Pause, Play, Rocket, Square } from "lucide-react";
import { memo } from "react";
import { isPausedAtom, isRunningAtom } from "../../context/editor-context.tsx";
import { IconButton } from "../ui/icon-button.tsx";

const playAtom = atom(null, (_, set) => set(isRunningAtom, true));
const stopAtom = atom(null, (_, set) => set(isRunningAtom, false));
const pauseAtom = atom(null, (_, set) => set(isPausedAtom, isPaused => !isPaused));

const PlaybackControls = () => {
  const isRunning = useAtomValue(isRunningAtom);
  const isPaused = useAtomValue(isPausedAtom);

  const handlePlay = useSetAtom(playAtom);
  const handleStop = useSetAtom(stopAtom);
  const handlePause = useSetAtom(pauseAtom);

  return (
    <div className="flex space-x-2">
      {isRunning ? (
        <>
          <IconButton onClick={handleStop} icon={Square} className="bg-red hover:bg-redDark" />

          <IconButton
            onClick={handlePause}
            icon={isPaused ? Play : Pause}
            className="bg-yellow hover:bg-yellowDark"
          />
        </>
      ) : (
        <>
          <IconButton
            onClick={handlePlay}
            icon={Rocket}
            className="bg-green hover:bg-greenDark"
          />

          <IconButton
            onClick={handlePause}
            icon={isPaused ? Play : Pause}
            className="bg-yellow hover:bg-yellowDark"
          />
        </>
      )}
    </div>
  );
};

const PlaybackControlsMemo = memo(PlaybackControls);
export { PlaybackControlsMemo as PlaybackControls };
