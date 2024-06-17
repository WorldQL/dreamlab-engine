import { useEffect, useState, type FC } from "react";
import { PlaybackControls } from "./playback-controls.tsx";
import { NewEntityMenu } from "./entity-menu.tsx";

export const TopSection: FC = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-background w-full flex items-center justify-between">
      <div className="flex space-x-2">
        <div className="relative">
          <button
            className="bg-primary hover:bg-primaryDark text-white font-semibold px-2 py-1 rounded"
            onClick={toggleMenu}
          >
            <i className="fas fa-plus"></i>
          </button>
          <NewEntityMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </div>
        <button className="bg-primary hover:bg-primaryDark text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-cogs"></i>
        </button>
        <button
          className="bg-secondary hover:bg-secondaryDark text-white font-semibold px-2 py-1 rounded"
          onClick={toggleTheme}
        >
          <i className={`fas fa-${theme === "dark" ? "sun" : "moon"}`}></i>
        </button>
      </div>
      <PlaybackControls />
    </div>
  );
};
