import { Empty, Rigidbody2D, Sprite2D, AnimatedSprite2D } from "@dreamlab/engine";
import { Plus } from "lucide-react";
// @deno-types="npm:@types/react@18.3.1"
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { game } from "../../global-game.ts";
import { useAtom } from "jotai";
import { historyAtom } from "../../context/editor-context.tsx";
import { cn } from "../../utils/cn.ts";
import { IconButton } from "../ui/icon-button.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip.tsx";

const NewEntityButton = () => {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [history, setHistory] = useAtom(historyAtom);

  const toggleMenu = useCallback(
    () => setIsMenuOpen(isMenuOpen => !isMenuOpen),
    [setIsMenuOpen],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const createEntity = useCallback(
    (
      entityType: typeof Empty | typeof Rigidbody2D | typeof Sprite2D | typeof AnimatedSprite2D,
    ) => {
      const newEntity = game.world.spawn({
        type: entityType,
        name: entityType.name,
      });

      setHistory([...history, { type: "add", entity: newEntity }]);

      setIsMenuOpen(false);
    },
    [setIsMenuOpen, history, setHistory],
  );

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            onClick={toggleMenu}
            ref={buttonRef}
            icon={Plus}
            className={cn(
              "bg-primary hover:bg-primaryDark",
              isMenuOpen && "bg-green hover:bg-greenDark",
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>New Entity</p>
        </TooltipContent>
      </Tooltip>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute mt-2 py-2 w-48 bg-card rounded-md shadow-xl z-20"
        >
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
          <button
            className="block w-full px-4 py-2 text-sm text-textPrimary hover:bg-secondary hover:text-white"
            onClick={() => createEntity(AnimatedSprite2D)}
          >
            AnimatedSprite2D
          </button>
        </div>
      )}
    </div>
  );
};

const NewEntityMenuMemo = memo(NewEntityButton);
export { NewEntityMenuMemo as NewEntityMenu };
