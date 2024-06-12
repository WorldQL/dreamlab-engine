import { createContext } from "react";
import { Entity } from "@dreamlab/engine";

export const SelectedEntityContext = createContext<{
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
}>({
  selectedEntity: null,
  setSelectedEntity: () => {},
});
