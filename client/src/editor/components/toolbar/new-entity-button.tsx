import { EntityConstructor } from "@dreamlab/engine";
import { Plus } from "lucide-react";
// @deno-types="npm:@types/react@18.3.1"
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { historyAtom, selectedEntityAtom } from "../../context/editor-context.tsx";
import { IconButton } from "../ui/icon-button.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip.tsx";
import { useGame } from "../../context/game-context.ts";
import { cn } from "../../utils/cn.ts";
import { getEntitiesForPath } from "../../utils/create-entity.ts";

interface NewEntityModalProps {
  closeMenu: () => void;
}

const NewEntityButton = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = useCallback(() => {
    setIsModalOpen(open => !open);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  });

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            onClick={toggleModal}
            ref={buttonRef}
            icon={Plus}
            className={cn(
              "bg-primary hover:bg-primaryDark",
              isModalOpen && "bg-green hover:bg-greenDark",
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>New Entity</p>
        </TooltipContent>
      </Tooltip>

      {isModalOpen && (
        <div ref={menuRef}>
          <NewEntityModal closeMenu={() => setIsModalOpen(false)} />{" "}
        </div>
      )}
    </div>
  );
};

const NewEntityModal: React.FC<NewEntityModalProps> = ({ closeMenu }) => {
  const game = useGame();
  const [selectedEntity] = useAtom(selectedEntityAtom);
  const [history, setHistory] = useAtom(historyAtom);

  const allowedEntities = getEntitiesForPath(selectedEntity?.id);

  const createEntity = useCallback(
    (entityType: EntityConstructor) => {
      const parent = selectedEntity ? selectedEntity : game.world._.EditEntities._.world;
      const newEntity = parent.spawn({
        type: entityType,
        name: entityType.name,
      });

      setHistory(prev => [...prev, { type: "add", entity: newEntity }]);
      closeMenu();
    },
    [game, selectedEntity, history, setHistory, closeMenu],
  );

  return (
    <div className="absolute mt-2 py-2 w-48 bg-grey rounded-md border border-white shadow-xl z-20">
      {allowedEntities.map(entityType => (
        <button
          key={entityType.name}
          className="block w-full px-4 py-2 text-sm text-textPrimary hover:bg-secondary hover:text-white"
          onClick={() => createEntity(entityType)}
        >
          {entityType.name}
        </button>
      ))}
    </div>
  );
};

const NewEntityMenuMemo = memo(NewEntityButton);
export { NewEntityMenuMemo as NewEntityMenu };
