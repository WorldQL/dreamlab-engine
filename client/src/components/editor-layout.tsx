import { type FC } from "react";
import { useEffect, useRef } from "react-jsx/jsx-runtime";
import TestButton from "./test-button.tsx";
import { game } from "../game.ts";
import { Entity, EntityDescendentDestroyed, EntityDescendentSpawned } from "@dreamlab/engine";
import { useForceUpdate } from "../hooks/force-update.ts";

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

  // TODO: we should probably have a hook for this type of thing
  const forceUpdate = useForceUpdate();
  game.world.on(EntityDescendentSpawned, () => forceUpdate());
  game.world.on(EntityDescendentDestroyed, () => forceUpdate());
  const sceneGraph = (
    <ul>
      {[...game.world.children.values()].map(ent => (
        <EntityEntry entity={ent} />
      ))}
    </ul>
  );

  return (
    <div className="container">
      <div className="left-column">
        scene graph / file tree
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
