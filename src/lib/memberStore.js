import { useSyncExternalStore } from "react";
import { members as seed } from "@/lib/mockData";

const KEY = "gymsync_members";
const listeners = new Set();
let state;

function seedMembers() {
  return seed.map((m) => ({ ...m, note: m.note || "", preferredTime: m.preferredTime || "Flexible", photoUrl: m.photoUrl || null }));
}
function read() {
  if (state !== undefined) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : seedMembers();
  } catch {
    state = seedMembers();
  }
  return state;
}
function emit() { listeners.forEach((l) => l()); }
function persist() { localStorage.setItem(KEY, JSON.stringify(state)); emit(); }

export function getMembers() { return read(); }
export function setMembers(updater) {
  state = typeof updater === "function" ? updater(read()) : updater;
  persist();
}
export function subscribe(l) { listeners.add(l); return () => listeners.delete(l); }
export function useMembers() { return useSyncExternalStore(subscribe, getMembers, getMembers); }