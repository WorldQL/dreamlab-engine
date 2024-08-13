import { Empty, Entity, EntityConstructor, Rigidbody2D, Sprite2D } from "@dreamlab/engine";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  selectedEntityAtom,
  copiedEntityAtom,
  historyAtom,
} from "../../context/editor-context.tsx";
import { useGame } from "../../context/game-context.ts";
import { ChevronRight } from "lucide-react";

interface SceneMenuProps {
  entity: Entity | undefined;
  position: { x: number; y: number };
  setIsOpen: (isOpen: boolean) => void;
}

export const SceneMenu = ({ entity, position, setIsOpen }: SceneMenuProps) => {
  const game = useGame();
  const [_selectedEntity, setSelectedEntity] = useAtom(selectedEntityAtom);
  const [copiedEntity, setCopiedEntity] = useAtom(copiedEntityAtom);
  const [history, setHistory] = useAtom(historyAtom);
  const menuRef = useRef<HTMLDivElement>(null);

  const createEntity = useCallback(
    (entityType: (typeof Empty | typeof Rigidbody2D | typeof Sprite2D) & EntityConstructor) => {
      const newEntity = game.world.spawn({
        type: entityType,
        name: entityType.name,
      });

      setHistory([...history, { type: "add", entity: newEntity }]);
      newEntity.parent = entity ? entity : game.world._.EditEntities._.world;
      setSelectedEntity(newEntity);
      setIsOpen(false);
    },
    [entity, setSelectedEntity, setIsOpen, history, setHistory, game.world],
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
      const newEntity = copiedEntity.cloneInto(game.world);
      setHistory([...history, { type: "add", entity: newEntity }]);
      setSelectedEntity(newEntity);
    }
    setIsOpen(false);
  }, [copiedEntity, setSelectedEntity, setIsOpen, history, setHistory, game.world]);

  const handleDelete = useCallback(() => {
    if (entity) {
      entity.destroy();
      setSelectedEntity(null);
    }
    setIsOpen(false);
  }, [entity, setSelectedEntity, setIsOpen]);

  const handleUnparent = useCallback(() => {
    if (entity) {
      entity.parent = game.world;
      setSelectedEntity(entity);
    }
    setIsOpen(false);
  }, [entity, setSelectedEntity, setIsOpen, game.world]);

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
      className="absolute max-w-[200px] w-full bg-grey text-white border border-white rounded-md shadow-lg z-50 p-1"
    >
      {entity ? (
        <>
          <MenuItem onClick={handleCopy} label="Copy" />
          <MenuItem
            onClick={handlePasteAsChild}
            label="Paste as Child"
            disabled={!copiedEntity}
          />
          <MenuItem onClick={handleDelete} label="Delete" />
          {entity.parent !== game.world && (
            <MenuItem onClick={handleUnparent} label="Unparent" />
          )}
          <SubMenu
            label="New Entity"
            options={[
              { label: "New Empty", onClick: () => createEntity(Empty) },
              { label: "New Rigidbody2D", onClick: () => createEntity(Rigidbody2D) },
              { label: "New Sprite2D", onClick: () => createEntity(Sprite2D) },
            ]}
          />
        </>
      ) : (
        <>
          <SubMenu
            label="New Entity"
            options={[
              { label: "New Empty", onClick: () => createEntity(Empty) },
              { label: "New Rigidbody2D", onClick: () => createEntity(Rigidbody2D) },
              { label: "New Sprite2D", onClick: () => createEntity(Sprite2D) },
            ]}
          />
          <MenuItem onClick={handlePaste} label="Paste" disabled={!copiedEntity} />
        </>
      )}
    </div>
  );
};

const MenuItem = ({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) => (
  <div
    className={`px-3 py-1 cursor-pointer text-sm hover:bg-primary rounded md whitespace-nowrap ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
    onClick={!disabled ? onClick : undefined}
  >
    {label}
  </div>
);

const SubMenu = ({
  label,
  options,
}: {
  label: string;
  options: { label: string; onClick: () => void }[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const subMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && subMenuRef.current) {
      const rect = subMenuRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        subMenuRef.current.style.left = `-${rect.width}px`;
      } else {
        subMenuRef.current.style.left = "100%";
      }
    }
  }, [isOpen]);

  return (
    <div
      className="relative w-full max-w-[200px] rounded-md px-3 py-1 text-sm cursor-pointer bg-grey hover:bg-primary flex items-center justify-between"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span>{label}</span>
      <ChevronRight className="w-4 h-4" />
      {isOpen && (
        <div
          ref={subMenuRef}
          className="absolute top-0 bg-grey text-white border border-white rounded-md shadow-lg min-w-max z-50 p-1"
          style={{ left: "100%" }}
        >
          {options.map((option, index) => (
            <MenuItem key={index} onClick={option.onClick} label={option.label} />
          ))}
        </div>
      )}
    </div>
  );
};
