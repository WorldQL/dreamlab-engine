import { createContext } from "react";
import { Entity } from "@dreamlab/engine";

export const EditorContext = createContext<{
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  isPaused: boolean;
  setIsPaused: (isPaused: boolean) => void;
}>({
  selectedEntity: null,
  setSelectedEntity: () => {},
  isRunning: false,
  setIsRunning: () => {},
  isPaused: false,
  setIsPaused: () => {},
});
