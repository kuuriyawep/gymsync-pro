import { useEffect, useSyncExternalStore } from "react";
import { gymData } from "@/lib/gymDataClient";

const emptyGym = { name: "", logoUrl: null, phone: "", email: "", address: "", isLoading: true, loadError: "" };
let state = emptyGym;
let loaded = false;
let loadingPromise = null;
const listeners = new Set();
function emit() { listeners.forEach((listener) => listener()); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getGym() { return state; }

export async function loadGym(force = false) {
  if (loaded && !force) return state;
  if (!loadingPromise) {
    loadingPromise = gymData("getGymProfile")
      .then((gym) => { state = { ...emptyGym, ...gym, isLoading: false }; loaded = true; emit(); return state; })
      .catch((error) => { state = { ...emptyGym, isLoading: false, loadError: error.message || "Unable to load gym profile" }; emit(); throw error; })
      .finally(() => { loadingPromise = null; });
  }
  return loadingPromise;
}

export async function setGym(gym) {
  const updated = await gymData("updateGymProfile", { gym });
  state = { ...emptyGym, ...updated, isLoading: false };
  loaded = true;
  emit();
  return state;
}

export function useGym() {
  useEffect(() => { loadGym().catch(() => {}); }, []);
  return useSyncExternalStore(subscribe, getGym, getGym);
}
