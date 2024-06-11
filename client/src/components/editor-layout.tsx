import { type FC, useState } from "react";
import { useEffect, useRef } from "react-jsx/jsx-runtime";
import TestButton from "./test-button.tsx";
import { SceneGraph } from "./scene-graph.tsx";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { Inspector } from "./inspector.tsx";

const EditorLayout: FC<{ gameDiv: HTMLDivElement }> = ({ gameDiv }) => {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [leftColumnWidth, setLeftColumnWidth] = useState(15);
  const [rightColumnWidth, setRightColumnWidth] = useState(15);

  const gameContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gameContainer.current?.appendChild(gameDiv);
  }, [gameContainer, gameDiv]);

  const handleLeftColumnResize = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = leftColumnWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX) / window.innerWidth * 100;
      setLeftColumnWidth(Math.min(Math.max(newWidth, 5), 45));
      console.log(leftColumnWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleRightColumnResize = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = rightColumnWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth - (e.clientX - startX) / window.innerWidth * 100;
      setRightColumnWidth(Math.min(Math.max(newWidth, 5), 45));
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
      <div
        className="dreamlab-container"
        style={{
          gridTemplateColumns: `${leftColumnWidth}% calc(100% - ${
            leftColumnWidth + rightColumnWidth
          }%) ${rightColumnWidth}%`,
        }}
      >
        <div className="left-column">
          <div style={{ display: "flex", flexWrap: "nowrap" }}>
            <div style={{ maxWidth: "100%", minWidth: "1px" }}>
              <SceneGraph />
            </div>
            <div
              className="resize-handle"
              style={{ height: "100vh", border: "3px solid red", maxWidth: "3px" }}
              onMouseDown={handleLeftColumnResize}
            >
            </div>
          </div>
        </div>
        <div className="middle-column">
          <div className="middle-top">
            <div className="game-container" ref={gameContainer}></div>
          </div>
          <div className="middle-bottom">
            console and other widgets
            <TestButton></TestButton>
          </div>
        </div>
        <div className="right-column">
          <Inspector />
        </div>
      </div>
    </SelectedEntityContext.Provider>
  );
};

export default EditorLayout;
