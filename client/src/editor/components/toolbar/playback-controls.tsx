import { atom, useAtomValue, useSetAtom } from "jotai";
import { Pause, Play, Rocket, Square } from "lucide-react";
// @deno-types="npm:@types/react@18.3.1"
import { memo } from "react";
import { isPausedAtom, isRunningAtom } from "../../context/editor-context.tsx";
import { IconButton } from "../ui/icon-button.tsx";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip.tsx";
import { setPlayModeGame, useGame, usePlayModeGame } from "../../context/game-context.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { connectToGame } from "../../../game-connection.ts";
import { JSON_CODEC } from "@dreamlab/proto/codecs/simple-json.ts";
import { setupGame } from "../../../game-setup.ts";

// TODO: Synchronize these with the actual game state.
const playAtom = atom(null, (_, set) => set(isRunningAtom, true));
const stopAtom = atom(null, (_, set) => {
  set(isRunningAtom, false);
  set(isPausedAtom, false);
});
const pauseAtom = atom(null, (_, set) => set(isPausedAtom, isPaused => !isPaused));

const PlaybackControls = ({ playModeGameDiv }: { playModeGameDiv: HTMLDivElement }) => {
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
            onClick={async () => {
              const connectUrl = new URL(
                `ws://127.0.0.1:8000/api/v1/connect/${game.instanceId}`,
              );
              connectUrl.searchParams.set("player_id", generateCUID("ply"));
              connectUrl.searchParams.set(
                "nickname",
                "Player" + Math.floor(Math.random() * 999) + 1,
              );
              connectUrl.searchParams.set("play_session", "1");

              const playSocket = new WebSocket(connectUrl);
              const [playGame, conn, _handshake] = await connectToGame(
                game.instanceId,
                playModeGameDiv,
                playSocket,
                JSON_CODEC,
              );
              await setupGame(playGame, conn, false);
              setPlayModeGame(playGame);

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
              const playModeGame = usePlayModeGame();
              playModeGame!.paused = true;
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
              const playModeGame = usePlayModeGame();
              playModeGame?.shutdown();
              setPlayModeGame(undefined);
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
