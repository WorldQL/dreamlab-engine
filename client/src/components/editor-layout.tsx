import { useAtomValue } from "jotai";
// @deno-types="npm:@types/react@18.3.1"
import { useEffect, useRef, useState } from "react";
import { isPausedAtom, isRunningAtom } from "../context/editor-context.tsx";
import { handleResize, handleVerticalResize } from "../utils/resize.ts";
import { Console } from "./console.tsx";
import { Inspector } from "./inspector.tsx";
import { Prefabs } from "./file-tree.tsx";
import { SceneGraph } from "./scene-graph.tsx";
import { NewEntityMenu } from "./toolbar/new-entity-button.tsx";
import { PlaybackControls } from "./toolbar/playback-controls.tsx";
import { SettingsButton } from "./toolbar/settings-button.tsx";
import { ThemeButton } from "./toolbar/theme-button.tsx";
import { CameraControls } from "./camera-controls.tsx";
import { cn } from "../utils/cn.ts";

export const EditorLayout = ({ gameDiv }: { readonly gameDiv: HTMLDivElement }) => {
  const isRunning = useAtomValue(isRunningAtom);
  const isPaused = useAtomValue(isPausedAtom);

  const [leftColumnWidth, setLeftColumnWidth] = useState(250);
  const [rightColumnWidth, setRightColumnWidth] = useState(250);
  const [topSectionHeight, setTopSectionHeight] = useState(50);
  const [consoleHeight, setConsoleHeight] = useState(150);

  const gameContainer = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const game = gameContainer.current;
    if (!game) return;

    game.appendChild(gameDiv);
    gameDiv.style.zIndex = "-1";
  }, [gameContainer, gameDiv]);

  return (
    <div className="flex h-screen bg-background">
      <div
        className="relative bg-background px-2 py-2 pr-3"
        style={{ width: `${leftColumnWidth}px` }}
      >
        <div
          ref={topSectionRef}
          className="overflow-y-auto pb-1"
          style={{ height: `${topSectionHeight}%` }}
        >
          <SceneGraph />
        </div>
        <div
          className="w-full cursor-row-resize bg-background rounded hover:bg-primary transition-colors duration-300 ease-in-out active:bg-primary"
          style={{ height: "5px" }}
          onMouseDown={e => handleVerticalResize(e, setTopSectionHeight, topSectionRef, 10, 90)}
        />
        <div className="overflow-y-auto pt-1" style={{ height: `${100 - topSectionHeight}%` }}>
          <Prefabs />
        </div>
        <div
          className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize rounded bg-background hover:bg-primary transition-colors duration-300 ease-in-out active:bg-primary"
          onMouseDown={e => handleResize(e, setLeftColumnWidth, "left", 250, 500)}
        />
      </div>
      <div className="relative flex-1 flex flex-col">
        {/* toolbar section */}
        <div className="p-1 bg-background my-1 z-40">
          <div className="bg-background w-full flex items-center justify-between">
            <div className="flex space-x-2">
              <NewEntityMenu />
              <SettingsButton />
              <ThemeButton />
            </div>
            <PlaybackControls />
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div
            className={cn(
              "z-10 absolute inset-0",
              isRunning && !isPaused && "border-4 border-green",
              isPaused && "border-4 border-yellow",
            )}
            ref={gameContainer}
          >
            <CameraControls />
          </div>
        </div>
        <div
          className="w-full cursor-row-resize rounded bg-background hover:bg-primary transition-colors duration-300 ease-in-out active:bg-primary"
          style={{ height: "5px" }}
          onMouseDown={e =>
            handleVerticalResize(e, setConsoleHeight, consoleRef, 150, 400, true)
          }
        />
        <div
          ref={consoleRef}
          className="bg-background p-1"
          style={{ height: `${consoleHeight}px` }}
        >
          <Console />
        </div>
      </div>
      <div
        className="relative min-w-[250px] bg-background px-2 py-2 pl-3"
        style={{ width: `${rightColumnWidth}px` }}
      >
        <Inspector />
        <div
          className="absolute top-0 left-0 bottom-0 w-1 rounded cursor-col-resize bg-background hover:bg-primary transition-colors duration-300 ease-in-out active:bg-primary"
          onMouseDown={e => handleResize(e, setRightColumnWidth, "right", 250, 500)}
        />
      </div>
    </div>
  );
};
