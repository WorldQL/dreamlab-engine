// This is temporary until we connect with the next app, so the user's theme preferences carry over.
import { useEffect, useState, type FC } from "react";

export const ThemeButton: FC = () => {
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
    <button
      className="bg-secondary hover:bg-secondaryDark text-white font-semibold px-2 py-1 rounded"
      onClick={toggleTheme}
    >
      <i className={`fas fa-${theme === "dark" ? "sun" : "moon"}`}></i>
    </button>
  );
};
