// This is temporary until we connect with the next app, so the user's theme preferences carry over.
import { useEffect, useState, type FC, useCallback, memo } from "react";
import { IconButton } from "../ui/icon-button.tsx";
import { Moon, Sun } from "lucide-react";

const ThemeButton: FC = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") ?? "light";
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

  const toggleTheme = useCallback(
    () => setTheme(theme => (theme === "dark" ? "light" : "dark")),
    [setTheme],
  );

  return <IconButton onClick={toggleTheme} icon={theme === "dark" ? Sun : Moon} />;
};

const ThemeButtonMemo = memo(ThemeButton);
export { ThemeButtonMemo as ThemeButton };
