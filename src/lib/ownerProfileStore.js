import { useSyncExternalStore } from "react";

const KEY = "owner_profile";
const defaults = { name: "Alex Kovac", email: "alex@olympicgym.com", phone: "+1 555 0100", photoUrl: null };
let state;
const listeners = new Set();

function read() {
  if (state) return state;
  const saved = localStorage.getItem(KEY);
  state = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  return state;
}

export function setOwnerProfile(profile) {
  state = { ...read(), ...profile };
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener());
}

export function useOwnerProfile() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    read,
    read
  );
}