import { useEffect, useRef, type FC } from "react";
import { game } from "../global-game.ts";
import { Empty, Rigidbody2D, Sprite2D } from "@dreamlab/engine";

interface NewEntityMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewEntityMenu: FC<NewEntityMenuProps> = ({ isOpen, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const createEntity = (entityType: typeof Empty | typeof Rigidbody2D | typeof Sprite2D) => {
    game.world.spawn({
      type: entityType,
      name: entityType.name,
    });
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div ref={menuRef} className="absolute mt-2 py-2 w-48 bg-card rounded-md shadow-xl z-20">
      <button
        className="block w-full px-4 py-2 text-sm text-textPrimary hover:bg-secondary hover:text-white"
        onClick={() => createEntity(Empty)}
      >
        Empty
      </button>
      <button
        className="block w-full px-4 py-2 text-sm text-textPrimary hover:bg-secondary hover:text-white"
        onClick={() => createEntity(Rigidbody2D)}
      >
        Rigidbody2D
      </button>
      <button
        className="block w-full px-4 py-2 text-sm text-textPrimary hover:bg-secondary hover:text-white"
        onClick={() => createEntity(Sprite2D)}
      >
        Sprite2D
      </button>
    </div>
  );
};
