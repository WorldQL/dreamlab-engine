import { useEffect, useRef, useState, type FC } from "react";

export const SettingsMenu: FC = () => {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
      <button
        ref={buttonRef}
        className={`${
          isMenuOpen ? "bg-green" : "bg-primary hover:bg-primaryDark"
        } text-white font-semibold px-2 py-1 rounded`}
        onClick={toggleMenu}
      >
        <i className="fas fa-cogs"></i>
      </button>
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute mt-2 py-2 w-48 bg-card rounded-md shadow-xl z-20"
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
