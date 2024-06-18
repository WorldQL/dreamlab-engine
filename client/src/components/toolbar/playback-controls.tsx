import { Pause, Play, Rocket, Square } from "lucide-react";
import { memo, useCallback } from "react";
import { useEditorContext } from "../../context/editor-context.tsx";
import { IconButton } from "../ui/icon-button.tsx";

const PlaybackControls = () => {
  const { isRunning, setIsRunning, isPaused, setIsPaused } = useEditorContext();

  const handlePlay = useCallback(() => setIsRunning(true), [setIsRunning]);
  const handleStop = useCallback(() => setIsRunning(false), [setIsRunning]);
  const handlePause = useCallback(() => setIsPaused(isPaused => !isPaused), [setIsPaused]);

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
