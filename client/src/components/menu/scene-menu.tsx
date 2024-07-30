import { Empty, Entity, EntityConstructor, Rigidbody2D, Sprite2D } from "@dreamlab/engine";
import { useAtom } from "jotai";
// @deno-types="npm:@types/react@18.3.1"
import { useCallback, useEffect, useRef } from "react";
import {
  selectedEntityAtom,
  copiedEntityAtom,
  historyAtom,
} from "../../context/editor-context.tsx";
import { currentGame } from "../../global-game.ts";
import { cn } from "../../utils/cn.ts";

interface SceneMenuProps {
  entity: Entity | undefined;
  position: { x: number; y: number };
  setIsOpen: (isOpen: boolean) => void;
}

export const SceneMenu = ({ entity, position, setIsOpen }: SceneMenuProps) => {
  const [_selectedEntity, setSelectedEntity] = useAtom(selectedEntityAtom);
  const [copiedEntity, setCopiedEntity] = useAtom(copiedEntityAtom);
  const [history, setHistory] = useAtom(historyAtom);
  const menuRef = useRef<HTMLDivElement>(null);

  const createEntity = useCallback(
    (entityType: (typeof Empty | typeof Rigidbody2D | typeof Sprite2D) & EntityConstructor) => {
      const newEntity = currentGame.world.spawn({
        type: entityType,
        name: entityType.name,
      });

      setHistory([...history, { type: "add", entity: newEntity }]);

      if (entity) {
        newEntity.parent = entity;
      }

      setSelectedEntity(newEntity);
      setIsOpen(false);
    },
    [entity, setSelectedEntity, setIsOpen, history, setHistory],
  );

  const handleCopy = useCallback(() => {
    if (entity) {
      setCopiedEntity(entity);
    }
    setIsOpen(false);
  }, [entity, setCopiedEntity, setIsOpen]);

  const handlePasteAsChild = useCallback(() => {
    if (copiedEntity && entity) {
      const newEntity = copiedEntity.cloneInto(entity);
      setHistory([...history, { type: "add", entity: newEntity }]);
      setSelectedEntity(newEntity);
    }
    setIsOpen(false);
  }, [copiedEntity, entity, setSelectedEntity, setIsOpen, history, setHistory]);

  const handlePaste = useCallback(() => {
    if (copiedEntity) {
      const newEntity = copiedEntity.cloneInto(currentGame.world);
      setHistory([...history, { type: "add", entity: newEntity }]);
      setSelectedEntity(newEntity);
    }
    setIsOpen(false);
  }, [copiedEntity, setSelectedEntity, setIsOpen, history, setHistory]);

  const handleDelete = useCallback(() => {
    if (entity) {
      entity.destroy();
      setSelectedEntity(null);
    }
    setIsOpen(false);
  }, [entity, setSelectedEntity, setIsOpen]);

  const handleUnparent = useCallback(() => {
    if (entity) {
      entity.parent = currentGame.world;
      setSelectedEntity(entity);
    }
    setIsOpen(false);
  }, [entity, setSelectedEntity, setIsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  return (
    <div
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className="absolute max-w-[200px] bg-background border border-primary rounded-lg shadow-lg p-3 z-50"
    >
      {entity ? (
        <>
          <div
            className={cn(
              "cursor-pointer hover:bg-primary text-textPrimary hover:text-white p-2 rounded-md transition-colors",
            )}
            onClick={handleCopy}
          >
            Copy
          </div>
          <div
            className={cn(
              "cursor-pointer hover:bg-primary text-textPrimary hover:text-white p-2 rounded-md transition-colors",
              !copiedEntity && "opacity-50",
            )}
            onClick={handlePasteAsChild}
          >
            Paste as Child
          </div>
          <div
            className={cn(
              "cursor-pointer hover:bg-primary text-textPrimary hover:text-white p-2 rounded-md transition-colors",
            )}
            onClick={handleDelete}
          >
            Delete
          </div>
          {entity.parent !== currentGame.world && (
            <div
              className={cn(
                "cursor-pointer hover:bg-primary text-textPrimary hover:text-white p-2 rounded-md transition-colors",
              )}
              onClick={handleUnparent}
            >
              Unparent
            </div>
          )}
        </>
      ) : (
        <>
          <div
            className={cn(
              "cursor-pointer hover:bg-primary text-textPrimary hover:text-white p-2 rounded-md transition-colors",
            )}
            onClick={() => createEntity(Empty)}
          >
            New Empty
          </div>
          <div
            className={cn(
              "cursor-pointer hover:bg-primary text-textPrimary hover:text-white p-2 rounded-md transition-colors",
            )}
            onClick={() => createEntity(Rigidbody2D)}
          >
            New Rigidbody2D
          </div>
          <div
            className={cn(
              "cursor-pointer hover:bg-primary text-textPrimary hover:text-white p-2 rounded-md transition-colors",
            )}
            onClick={() => createEntity(Sprite2D)}
          >
            New Sprite2D
          </div>
          <div
            className={cn(
              "cursor-pointer hover:bg-primary text-textPrimary hover:text-white p-2 rounded-md transition-colors",
              !copiedEntity && "opacity-50",
            )}
            onClick={handlePaste}
          >
            Paste
          </div>
        </>
      )}
    </div>
  );
};
