import { type FC } from "react";
import { useEffect, useRef } from "react-jsx/jsx-runtime";
import TestButton from "./test-button.tsx";
import { game } from "../game.ts";
import { Entity } from "@dreamlab/engine";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";

const EntityEntry: FC<{ entity: Entity }> = ({ entity }) => (
  <li key={entity.ref}>
    {entity.name}
    <ul>
      {[...entity.children.values()].map(e => (
        <EntityEntry entity={e} />
      ))}
    </ul>
  </li>
);

const EditorLayout: FC<{ gameDiv: HTMLDivElement }> = ({ gameDiv }) => {
  const gameContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gameContainer.current?.appendChild(gameDiv);
  }, [gameContainer, gameDiv]);

  useForceUpdateOnEntityChange();

  const sceneGraph = (
    <ul>
      {[...game.world.children.values()].map(ent => (
        <EntityEntry entity={ent} />
      ))}
    </ul>
  );
  return (
    <div className="dreamlab-container">
      <div className="left-column">
        scene graph / file tree test123
        {sceneGraph}
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
      <div className="right-column">inspector</div>
    </div>
  );
};

export default EditorLayout;
