import { type FC } from "react";
import { useEffect, useRef } from "react-jsx/jsx-runtime";
import TestButton from "./test-button.tsx";

const EditorLayout: FC<{ gameDiv: HTMLDivElement }> = ({ gameDiv }) => {
  const gameContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gameContainer.current?.appendChild(gameDiv);
  }, [gameContainer, gameDiv]);

  return (
    <div className="container">
      <div className="left-column">scene graph / file tree</div>
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
