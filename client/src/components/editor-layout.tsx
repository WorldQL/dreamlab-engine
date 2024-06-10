import { type FC, useState } from "react";
import { useEffect, useRef } from "react-jsx/jsx-runtime";
import TestButton from "./test-button.tsx";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";
import { SceneGraph } from "./scene-graph.tsx";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { Inspector } from "./inspector.tsx";

const EditorLayout: FC<{ gameDiv: HTMLDivElement }> = ({ gameDiv }) => {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  const gameContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gameContainer.current?.appendChild(gameDiv);
  }, [gameContainer, gameDiv]);

  useForceUpdateOnEntityChange();

  return (
    <SelectedEntityContext.Provider value={{ selectedEntity, setSelectedEntity }}>
      <div className="dreamlab-container">
        <div className="left-column">
          <SceneGraph />
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
