// This is temporary until we connect with the next app, so the user's theme preferences carry over.
// @deno-types="npm:@types/react@18.3.1"
import { useEffect, useState, type FC, useCallback, memo } from "react";
import { IconButton } from "../ui/icon-button.tsx";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip.tsx";

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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton onClick={toggleTheme} icon={theme === "dark" ? Sun : Moon} />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Theme</p>
      </TooltipContent>
    </Tooltip>
  );
};

const ThemeButtonMemo = memo(ThemeButton);
export { ThemeButtonMemo as ThemeButton };
