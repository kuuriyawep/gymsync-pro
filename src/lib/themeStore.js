import { useSyncExternalStore } from "react";

const STORAGE_KEY = "gymSyncTheme";
const listeners = new Set();
let currentTheme = "light";

const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => currentTheme;

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function initTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") currentTheme = stored;
  } catch {}
  applyTheme(currentTheme);
}

export function setTheme(theme) {
  currentTheme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  applyTheme(theme);
  emit();
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Auto-initialize on first import so the class is set before React renders.
if (typeof document !== "undefined") initTheme();