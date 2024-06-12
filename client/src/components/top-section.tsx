import { useEffect, useState, type FC } from "react";

export const TopSection: FC = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

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

  return (
    <div className="bg-background w-full flex items-center justify-between">
      <div className="flex space-x-2">
        <button
          className="bg-secondary hover:bg-secondaryDark text-white font-semibold px-2 py-1 rounded"
          onClick={toggleTheme}
        >
          <i className={`fas fa-${theme === "dark" ? "sun" : "moon"}`}></i>
        </button>
        <button className="bg-primary hover:bg-primaryDark text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-cogs"></i>
        </button>
        <button className="bg-primary hover:bg-primaryDark text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-wrench"></i>
        </button>
        <button className="bg-primary hover:bg-primaryDark text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-tools"></i>
        </button>
      </div>
      <div className="flex space-x-2">
        <button className="bg-green hover:bg-greenDark text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-play"></i>
        </button>
        <button className="bg-red hover:bg-redDark text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-stop"></i>
        </button>
        <button className="bg-yellow hover:bg-yellowDark text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-pause"></i>
        </button>
      </div>
    </div>
  );
};

export default TopSection;
