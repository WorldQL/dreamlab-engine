import React, { type FC, useState, useRef, useEffect } from "react-jsx/jsx-runtime";
import TestButton from "./test-button.tsx";
import { SceneGraph } from "./scene-graph.tsx";
import { Prefabs } from "./prefabs.tsx";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { Inspector } from "./inspector.tsx";

const EditorLayout: FC<{ gameDiv: HTMLDivElement }> = ({ gameDiv }) => {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [leftColumnWidth, setLeftColumnWidth] = useState(250);
  const [rightColumnWidth, setRightColumnWidth] = useState(250);
  const [topSectionHeight, setTopSectionHeight] = useState(50);

  const gameContainer = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gameContainer.current?.appendChild(gameDiv);
  }, [gameContainer, gameDiv]);

  const handleResize = (
    e: React.MouseEvent<HTMLDivElement>,
    setColumnWidth: (width: number) => void,
    columnKey: "left" | "right",
  ) => {
    const startX = e.clientX;
    const startWidth = e.currentTarget.parentElement?.clientWidth || 0;

    const handleMouseMove = (e: MouseEvent) => {
      const diffX = e.clientX - startX;
      const newWidth = startWidth + (columnKey === "left" ? diffX : -diffX);
      const minWidth = 250;
      const maxWidth = 500;

      setColumnWidth(Math.max(Math.min(newWidth, maxWidth), minWidth));

      if (columnKey === "left") {
        const gameContainerWidth = window.innerWidth - (newWidth + rightColumnWidth);
        gameContainer.current!.style.width = `${gameContainerWidth}px`;
      } else {
        const gameContainerWidth = window.innerWidth - (leftColumnWidth + newWidth);
        gameContainer.current!.style.width = `${gameContainerWidth}px`;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleVerticalResize = (e: React.MouseEvent<HTMLDivElement>) => {
    const startY = e.clientY;
    const startHeight = topSectionRef.current?.clientHeight || 0;

    const handleMouseMove = (e: MouseEvent) => {
      const diffY = e.clientY - startY;
      const newHeight = ((startHeight + diffY) / window.innerHeight) * 100;
      const minHeight = 10;
      const maxHeight = 90;

      setTopSectionHeight(Math.max(Math.min(newHeight, maxHeight), minHeight));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <SelectedEntityContext.Provider value={{ selectedEntity, setSelectedEntity }}>
      <div className="flex h-screen bg-light-background dark:bg-dark-background">
        <div
          className="relative min-w-[250px] bg-light-background dark:bg-dark-background px-2 py-2 pr-3"
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
            className="w-full cursor-row-resize bg-accent-primaryLight hover:bg-accent-primary transition-colors duration-300 ease-in-out"
            style={{ height: "5px" }}
            onMouseDown={handleVerticalResize}
          />
          <div
            className="overflow-y-auto pt-1"
            style={{ height: `${100 - topSectionHeight}%` }}
          >
            <Prefabs />
          </div>
          <div
            className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-accent-primaryLight hover:bg-accent-primary transition-colors duration-300 ease-in-out"
            onMouseDown={e => handleResize(e, setLeftColumnWidth, "left")}
          />
        </div>
        <div className="relative flex-1 flex flex-col">
          <div className="relative flex-1 overflow-hidden">
            <div className="absolute inset-0" ref={gameContainer} />
          </div>
          <div className="p-4 bg-light-background dark:bg-dark-background">
            <div className="text-light-textSecondary dark:text-dark-textSecondary">
              console and other widgets
            </div>
            <TestButton />
          </div>
        </div>
        <div
          className="relative min-w-[250px] bg-light-background dark:bg-dark-background px-2 py-2 pl-3"
          style={{ width: `${rightColumnWidth}px` }}
        >
          <Inspector />
          <div
            className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize bg-accent-primaryLight hover:bg-accent-primary transition-colors duration-300 ease-in-out"
            onMouseDown={e => handleResize(e, setRightColumnWidth, "right")}
          />
        </div>
      </div>
    </SelectedEntityContext.Provider>
  );
};

export default EditorLayout;
