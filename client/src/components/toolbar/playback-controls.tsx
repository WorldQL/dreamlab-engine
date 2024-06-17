import { FC, useContext } from "react";
import { EditorContext } from "../../context/editor-context.tsx";

export const PlaybackControls: FC = () => {
  const { isRunning, setIsRunning, isPaused, setIsPaused } = useContext(EditorContext);

  const handlePlay = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  return (
    <div className="flex space-x-2">
      {isRunning ? (
        <>
          <button
            className="bg-red hover:bg-redDark text-white font-semibold px-2 py-1 rounded"
            onClick={handleStop}
          >
            <i className="fas fa-stop"></i>
          </button>
          <button
            className="bg-yellow hover:bg-yellowDark text-white font-semibold px-2 py-1 rounded"
            onClick={handlePause}
          >
            <i className={`fas fa-${isPaused ? "play" : "pause"}`}></i>
          </button>
        </>
      ) : (
        <>
          <button
            className="bg-green hover:bg-greenDark text-white font-semibold px-2 py-1 rounded"
            onClick={handlePlay}
          >
            <i className="fas fa-rocket"></i>
          </button>
          <button
            className="bg-yellow hover:bg-yellowDark text-white font-semibold px-2 py-1 rounded"
            onClick={handlePause}
          >
            <i className={`fas fa-${isPaused ? "play" : "pause"}`}></i>
          </button>
        </>
      )}
    </div>
  );
};
