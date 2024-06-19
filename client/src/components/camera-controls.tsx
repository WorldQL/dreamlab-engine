import React, { useEffect, useRef } from "react";
import { Camera, GameRender, Vector2 } from "@dreamlab/engine";
import { game } from "../global-game.ts";

export const CameraControls: React.FC = () => {
  const cameraRef = useRef<Camera | undefined>();
  const isDraggingRef = useRef(false);
  const lastMousePositionRef = useRef<Vector2>(Vector2.ZERO);
  const isSpaceDownRef = useRef(false);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleRender = () => {
      cameraRef.current = Camera.getActive(game);
      if (cameraRef.current) {
        cameraRef.current.smooth.value = 1;
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 1 || (isSpaceDownRef.current && event.button === 0)) {
        isDraggingRef.current = true;
        lastMousePositionRef.current = new Vector2(event.clientX, event.clientY);
        updateCursor();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingRef.current && cameraRef.current) {
        const currentMousePosition = new Vector2(event.clientX, event.clientY);
        const delta = lastMousePositionRef.current.sub(currentMousePosition);
        lastMousePositionRef.current = currentMousePosition;

        const worldDelta = cameraRef.current
          .screenToWorld(delta)
          .sub(cameraRef.current.screenToWorld(Vector2.ZERO));
        cameraRef.current.transform.position = cameraRef.current.transform.position.add(
          new Vector2(worldDelta.x, -worldDelta.y),
        );
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 1 || (isSpaceDownRef.current && event.button === 0)) {
        isDraggingRef.current = false;
        updateCursor();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        isSpaceDownRef.current = true;
        updateCursor();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        isSpaceDownRef.current = false;
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
        }
        updateCursor();
      }
    };

    const updateCursor = () => {
      const gameContainer = gameContainerRef.current;
      if (gameContainer) {
        gameContainer.style.cursor =
          isDraggingRef.current || isSpaceDownRef.current ? "grabbing" : "default";
      }
    };

    game.on(GameRender, handleRender);

    const gameContainer = gameContainerRef.current;
    if (gameContainer) {
      gameContainer.addEventListener("mousedown", handleMouseDown);
      gameContainer.addEventListener("mousemove", handleMouseMove);
      gameContainer.addEventListener("mouseup", handleMouseUp);
      globalThis.addEventListener("keydown", handleKeyDown);
      globalThis.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      game.unregister(GameRender, handleRender);

      if (gameContainer) {
        gameContainer.removeEventListener("mousedown", handleMouseDown);
        gameContainer.removeEventListener("mousemove", handleMouseMove);
        gameContainer.removeEventListener("mouseup", handleMouseUp);
        globalThis.removeEventListener("keydown", handleKeyDown);
        globalThis.removeEventListener("keyup", handleKeyUp);
      }
    };
  }, []);

  return <div ref={gameContainerRef} className="absolute inset-0" />;
};
