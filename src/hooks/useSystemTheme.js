import { useEffect } from "react";

/**
 * Keeps the document theme in sync with the device's colour scheme.
 *
 * The `.dark` class is toggled on <html> (the document root) rather than on a
 * page wrapper, so every token-based surface — page background, cards,
 * popovers, borders and text — follows the system setting automatically and
 * overlays rendered in a portal (sheets, toasts) inherit the same palette.
 */
export default function useSystemTheme() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const query = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (isDark) => {
      const root = document.documentElement;
      root.classList.toggle("dark", isDark);
      // Keeps native controls (date/time pickers, scrollbars, form widgets)
      // in the same scheme as the app chrome.
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    apply(query.matches);

    const listener = (event) => apply(event.matches);
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    }
    // Safari < 14
    query.addListener(listener);
    return () => query.removeListener(listener);
  }, []);
}