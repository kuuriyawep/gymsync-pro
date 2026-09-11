import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "gymsync-theme";
const readTheme = () => typeof window === "undefined" ? "light" : localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
const applyTheme = (theme) => document.documentElement.classList.toggle("dark", theme === "dark");

export default function useTheme() {
  const [theme, setThemeState] = useState(readTheme);

  useEffect(() => {
    applyTheme(theme);
    const sync = (event) => setThemeState(event.detail || readTheme());
    window.addEventListener("gymsync-theme-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("gymsync-theme-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    const next = nextTheme === "dark" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    setThemeState(next);
    window.dispatchEvent(new CustomEvent("gymsync-theme-change", { detail: next }));
  }, []);

  return { theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") };
}