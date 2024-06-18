import { type FC, useState, useRef, useEffect } from "react";
import { SceneGraph } from "./scene-graph.tsx";
import { Prefabs } from "./prefabs.tsx";
import { Entity } from "@dreamlab/engine";
import { EditorContext } from "../context/editor-context.tsx";
import { Inspector } from "./inspector.tsx";
import Console from "./console.tsx";
import { handleVerticalResize, handleResize, handleConsoleResize } from "../utils/resize.ts";
import { NewEntityMenu } from "./toolbar/entity-menu.tsx";
import { PlaybackControls } from "./toolbar/playback-controls.tsx";
import { SettingsMenu } from "./toolbar/settings-menu.tsx";
import { ThemeButton } from "./toolbar/theme-button.tsx";

interface EditorProps {
  gameDiv: HTMLDivElement;
}

const EditorLayout: FC<EditorProps> = ({ gameDiv }: EditorProps) => {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [leftColumnWidth, setLeftColumnWidth] = useState(250);
  const [rightColumnWidth, setRightColumnWidth] = useState(250);
  const [topSectionHeight, setTopSectionHeight] = useState(50);
  const [consoleHeight, setConsoleHeight] = useState(150);

  const gameContainer = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gameContainer.current?.appendChild(gameDiv);
  }, [gameContainer, gameDiv]);

  return (
    <EditorContext.Provider
      value={{
        selectedEntity,
        setSelectedEntity,
        isRunning,
        setIsRunning,
        isPaused,
        setIsPaused,
      }}
    >
      <div className="flex h-screen bg-background">
        <div
          className="relative min-w-[250px] bg-background px-2 py-2 pr-3"
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
            onMouseDown={e => handleVerticalResize(e, setTopSectionHeight, topSectionRef)}
          />
          <div
            className="overflow-y-auto pt-1"
            style={{ height: `${100 - topSectionHeight}%` }}
          >
            <Prefabs />
          </div>
          <div
            className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize rounded bg-background hover:bg-primary transition-colors duration-300 ease-in-out active:bg-primary"
            onMouseDown={e =>
              handleResize(
                e,
                setLeftColumnWidth,
                "left",
                leftColumnWidth,
                rightColumnWidth,
                gameContainer,
              )
            }
          />
        </div>
        <div className="relative flex-1 flex flex-col">
          {/* toolbar section */}
          <div className="p-1 bg-background">
            <div className="bg-background w-full flex items-center justify-between">
              <div className="flex space-x-2">
                <NewEntityMenu />
                <SettingsMenu />
                <ThemeButton />
              </div>
              <PlaybackControls />
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div
              className={`absolute inset-0 ${
                isRunning
                  ? isPaused
                    ? "border-4 border-yellow border-t-green border-b-green"
                    : "border-4 border-green"
                  : isPaused
                    ? "border-4 border-yellow"
                    : ""
              }`}
              ref={gameContainer}
            />
          </div>
          <div
            className="w-full cursor-row-resize rounded bg-background hover:bg-primary transition-colors duration-300 ease-in-out active:bg-primary"
            style={{ height: "5px" }}
            onMouseDown={e =>
              handleConsoleResize(e, setConsoleHeight, consoleRef, topSectionRef, gameContainer)
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
            onMouseDown={e =>
              handleResize(
                e,
                setRightColumnWidth,
                "right",
                leftColumnWidth,
                rightColumnWidth,
                gameContainer,
              )
            }
          />
        </div>
      </div>
    </EditorContext.Provider>
  );
};

export default EditorLayout;
