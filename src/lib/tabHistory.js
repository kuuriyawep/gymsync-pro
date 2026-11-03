import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Remembers the last location visited inside each bottom-bar tab so switching
 * between tabs restores where the user left off (e.g. a member's detail page)
 * instead of resetting to the tab's first screen.
 *
 * Kept in sessionStorage so a reload of the installed app keeps the history
 * for the session without persisting beyond it.
 */
const STORAGE_KEY = "gymsync:tab-history";
const memory = new Map();
let hydrating = true;

function store() {
  if (hydrating) {
    hydrating = false;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) Object.entries(JSON.parse(raw)).forEach(([tab, path]) => memory.set(tab, path));
    } catch {
      /* private mode / storage disabled — in-memory history still works */
    }
  }
  return memory;
}

function persist() {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(memory)));
  } catch {
    /* ignore quota or disabled storage */
  }
}

/** Longest matching tab for a pathname; "/" only matches the home route. */
export function tabForPath(pathname, tabPaths) {
  return [...tabPaths]
    .sort((a, b) => b.length - a.length)
    .find((tab) => (tab === "/" ? pathname === "/" : pathname === tab || pathname.startsWith(`${tab}/`))) || null;
}

export function recordTabLocation(tab, location) {
  const next = `${location.pathname}${location.search || ""}`;
  const current = store();
  if (current.get(tab) === next) return;
  current.set(tab, next);
  persist();
}

export function rememberedTabLocation(tab) {
  return store().get(tab) || tab;
}

/**
 * Target for a tab button: tapping the tab you are already inside returns to
 * its root, otherwise it restores that tab's last location.
 */
export function tabTarget(tab, pathname) {
  if (tabForPath(pathname, [tab]) === tab) return tab;
  return rememberedTabLocation(tab);
}

/** Records every navigation into the tab history. */
export function useTabHistory(tabPaths) {
  const location = useLocation();
  const paths = useRef(tabPaths);
  paths.current = tabPaths;

  useEffect(() => {
    const tab = tabForPath(location.pathname, paths.current);
    if (tab) recordTabLocation(tab, location);
  }, [location]);
}