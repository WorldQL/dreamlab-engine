import React, { type FC, useState, useRef, useEffect } from "react";
import TestButton from "./test-button.tsx";
import { SceneGraph } from "./scene-graph.tsx";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { Inspector } from "./inspector.tsx";

const EditorLayout: FC<{ gameDiv: HTMLDivElement }> = ({ gameDiv }) => {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [leftColumnWidth, setLeftColumnWidth] = useState(250);
  const [rightColumnWidth, setRightColumnWidth] = useState(250);

  const gameContainer = useRef<HTMLDivElement>(null);

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
      const maxWidth = window.innerWidth - (leftColumnWidth + rightColumnWidth);

      setColumnWidth(Math.max(Math.min(newWidth, maxWidth), minWidth));

      console.log(Math.max(Math.min(newWidth, maxWidth), minWidth));

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

  return (
    <SelectedEntityContext.Provider value={{ selectedEntity, setSelectedEntity }}>
      <div className="flex h-screen">
        <div className="relative min-w-[250px]" style={{ width: `${leftColumnWidth}px` }}>
          <SceneGraph />
          <div
            className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize"
            onMouseDown={e => handleResize(e, setLeftColumnWidth, "left")}
          />
        </div>
        <div className="relative flex-1 flex flex-col">
          <div className="relative flex-1 overflow-hidden">
            <div className="absolute inset-0" ref={gameContainer} />
          </div>
          <div>
            console and other widgets
            <TestButton />
          </div>
        </div>
        <div className="relative min-w-[250px]" style={{ width: `${rightColumnWidth}px` }}>
          <Inspector />
          <div
            className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize"
            onMouseDown={e => handleResize(e, setRightColumnWidth, "right")}
          />
        </div>
      </div>
    </SelectedEntityContext.Provider>
  );
};

export default EditorLayout;
