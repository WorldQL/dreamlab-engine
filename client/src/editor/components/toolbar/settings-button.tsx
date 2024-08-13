import { Settings } from "lucide-react";
// @deno-types="npm:@types/react@18.3.1"
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn.ts";
import { IconButton } from "../ui/icon-button.tsx";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip.tsx";

export const SettingsButton = () => {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            onClick={toggleMenu}
            ref={buttonRef}
            icon={Settings}
            className={cn(
              "bg-primary hover:bg-primaryDark",
              isMenuOpen && "bg-green hover:bg-greenDark",
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute mt-2 py-2 w-48 bg-grey border border-white rounded-md shadow-xl z-20"
        >
          <button className="block w-full px-4 py-2 text-sm text-textPrimary hover:bg-secondary hover:text-white">
            Setting 1
          </button>
          <button className="block w-full px-4 py-2 text-sm text-textPrimary hover:bg-secondary hover:text-white">
            Setting 2
          </button>
          <button className="block w-full px-4 py-2 text-sm text-textPrimary hover:bg-secondary hover:text-white">
            Setting 3
          </button>
        </div>
      )}
    </div>
  );
};
