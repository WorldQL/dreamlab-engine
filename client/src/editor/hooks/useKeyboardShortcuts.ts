// @deno-types="npm:@types/react@18.3.1"
import { useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import {
  selectedEntityAtom,
  copiedEntityAtom,
  historyAtom,
} from "../context/editor-context.tsx";
import { useGame } from "../context/game-context.ts";

export const useKeyboardShortcuts = () => {
  const game = useGame();

  const [selectedEntity, setSelectedEntity] = useAtom(selectedEntityAtom);
  const [copiedEntity, setCopiedEntity] = useAtom(copiedEntityAtom);
  const [history, setHistory] = useAtom(historyAtom);

  const handleUndo = useCallback(() => {
    const lastAction = history.pop();
    if (lastAction) {
      if (lastAction.type === "add") {
        lastAction.entity.destroy();
      } else if (lastAction.type === "remove") {
        // FIXME: action should have an entitydef and not an entity
        // @ts-expect-error this should be an EntityDefinition and not an entity oh well
        game.world.spawn(lastAction.entity);
      }
      setHistory([...history]);
    }
  }, [history, setHistory]);

  const handleCopy = useCallback(() => {
    if (selectedEntity) {
      setCopiedEntity(selectedEntity);
    }
  }, [selectedEntity, setCopiedEntity]);

  const handlePaste = useCallback(() => {
    if (copiedEntity) {
      const newEntity = copiedEntity.cloneInto(game.world);
      setHistory([...history, { type: "add", entity: newEntity }]);
      setSelectedEntity(newEntity);
    }
  }, [copiedEntity, setSelectedEntity, history, setHistory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "z":
            event.preventDefault();
            handleUndo();
            break;
          case "c":
            event.preventDefault();
            handleCopy();
            break;
          case "v":
            event.preventDefault();
            handlePaste();
            break;
          default:
            break;
        }
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleCopy, handlePaste]);

  return null;
};
