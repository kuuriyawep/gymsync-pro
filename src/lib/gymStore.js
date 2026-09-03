import { useSyncExternalStore } from "react";
import { gymInfo } from "@/lib/mockData";

const KEY = "gym_profile";
const defaults = {
  name: gymInfo.name,
  logoUrl: null,
  phone: gymInfo.phone,
  email: gymInfo.email,
  address: gymInfo.address,
  description: "A premium fitness center offering strength training, cardio, group classes and personal training.",
};

let state;
const listeners = new Set();

function read() {
  if (state !== undefined) return state;
  try {
    const parsed = localStorage.getItem(KEY) ? JSON.parse(localStorage.getItem(KEY)) : null;
    state = { ...defaults, ...(parsed || {}) };
  } catch {
    state = { ...defaults };
  }
  return state;
}
function emit() { listeners.forEach((l) => l()); }
function persist() { localStorage.setItem(KEY, JSON.stringify(state)); emit(); }

export function getGym() { return read(); }
export function setGym(patch) { state = { ...read(), ...patch }; persist(); }
export function subscribe(l) { listeners.add(l); return () => listeners.delete(l); }
export function useGym() { return useSyncExternalStore(subscribe, getGym, getGym); }