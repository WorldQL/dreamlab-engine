import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, GameRender, Vector2 } from "@dreamlab/engine";
import { game } from "../global-game.ts";
import { MousePointer2, Move, ZoomIn } from "lucide-react";

export const CameraControls: React.FC = () => {
  const cameraRef = useRef<Camera | undefined>();
  const isDraggingRef = useRef(false);
  const lastMousePositionRef = useRef<Vector2>(Vector2.ZERO);
  const isSpaceDownRef = useRef(false);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  const [cameraPosition, setCameraPosition] = useState<Vector2>(Vector2.ZERO);
  const [cursorPosition, setCursorPosition] = useState<Vector2>(Vector2.ZERO);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const updateCursor = useCallback(() => {
    const gameContainer = gameContainerRef.current;
    if (gameContainer) {
      gameContainer.style.cursor = isDraggingRef.current
        ? "grabbing"
        : isSpaceDownRef.current
        ? "grab"
        : "default";
    }
  }, []);

  const handleRender = useCallback(() => {
    cameraRef.current = Camera.getActive(game);
    if (cameraRef.current) {
      cameraRef.current.smooth.value = 1;
      setCameraPosition(cameraRef.current.transform.position);
      setZoomScale(cameraRef.current.transform.scale.x);
    }
  }, []);

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (event.button === 1 || (isSpaceDownRef.current && event.button === 0)) {
        isDraggingRef.current = true;
        lastMousePositionRef.current = new Vector2(event.clientX, event.clientY);
        updateCursor();
      }
    },
    [updateCursor],
  );

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const currentMousePosition = new Vector2(event.clientX, event.clientY);
    setCursorPosition(currentMousePosition);

    if (isDraggingRef.current && cameraRef.current) {
      const delta = lastMousePositionRef.current.sub(currentMousePosition);
      lastMousePositionRef.current = currentMousePosition;

      const worldDelta = cameraRef.current
        .screenToWorld(delta)
        .sub(cameraRef.current.screenToWorld(Vector2.ZERO));
      cameraRef.current.transform.position = cameraRef.current.transform.position.add(
        new Vector2(worldDelta.x, -worldDelta.y),
      );
    }
  }, []);

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (event.button === 1 || (isSpaceDownRef.current && event.button === 0)) {
        isDraggingRef.current = false;
        updateCursor();
      }
    },
    [updateCursor],
  );

  const handleWheel = useCallback((event: WheelEvent) => {
    if (cameraRef.current) {
      event.preventDefault();
      if (event.ctrlKey) {
        const zoomFactor = 1.1;
        const zoomDirection = event.deltaY > 0 ? 1 : -1;
        const newScale = cameraRef.current.transform.scale.mul(
          new Vector2(Math.pow(zoomFactor, zoomDirection), Math.pow(zoomFactor, zoomDirection)),
        );
        cameraRef.current.transform.scale = newScale;
        setZoomScale(newScale.x);
      } else {
        const scrollSpeed = 50;
        const scrollDirection = event.deltaY > 0 ? 1 : -1;
        const scrollDelta = new Vector2(0, scrollDirection * scrollSpeed);
        const worldDelta = cameraRef.current
          .screenToWorld(scrollDelta)
          .sub(cameraRef.current.screenToWorld(Vector2.ZERO));
        cameraRef.current.transform.position =
          cameraRef.current.transform.position.add(worldDelta);
      }
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space") {
        isSpaceDownRef.current = true;
        updateCursor();
      }
    },
    [updateCursor],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space") {
        isSpaceDownRef.current = false;
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
        }
        updateCursor();
      }
    },
    [updateCursor],
  );

  useEffect(() => {
    game.on(GameRender, handleRender);

    const gameContainer = gameContainerRef.current;
    if (gameContainer) {
      gameContainer.addEventListener("mousedown", handleMouseDown);
      gameContainer.addEventListener("mousemove", handleMouseMove);
      gameContainer.addEventListener("mouseup", handleMouseUp);
      gameContainer.addEventListener("wheel", handleWheel);
      globalThis.addEventListener("keydown", handleKeyDown);
      globalThis.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      game.unregister(GameRender, handleRender);

      if (gameContainer) {
        gameContainer.removeEventListener("mousedown", handleMouseDown);
        gameContainer.removeEventListener("mousemove", handleMouseMove);
        gameContainer.removeEventListener("mouseup", handleMouseUp);
        gameContainer.removeEventListener("wheel", handleWheel);
      }
      globalThis.removeEventListener("keydown", handleKeyDown);
      globalThis.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    handleRender,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleKeyDown,
    handleKeyUp,
  ]);

  return (
    <div ref={gameContainerRef} className="absolute inset-0">
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow">
        <div className="flex items-center space-x-2">
          <Move className="w-4 h-4" />
          <span>
            Camera Position: ({cameraPosition.x.toFixed(2)}, {cameraPosition.y.toFixed(2)})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <MousePointer2 className="w-4 h-4" />
          <span>
            Cursor Position: ({cursorPosition.x.toFixed(0)}, {cursorPosition.y.toFixed(0)})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <ZoomIn className="w-4 h-4" />
          <span>Zoom Scale: {zoomScale.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
};