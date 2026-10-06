import { useEffect, useSyncExternalStore } from "react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

const emptyGym = {
  name: "",
  logoUrl: null,
  phone: "",
  email: "",
  address: "",
  notifications: { expiry: false, payments: false, newMembers: false },
  isLoading: true,
  loadError: "",
};

let state = emptyGym;
let loaded = false;
let loadingPromise = null;
const listeners = new Set();

function emit() { listeners.forEach((listener) => listener()); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getGym() { return state; }

export async function loadGym() {
  if (loaded) return state;
  if (!loadingPromise) {
    loadingPromise = invokeWithAuth("gymAccess", { operation: "getGymProfile" })
      .then((response) => {
        state = { ...emptyGym, ...response.data.gym, isLoading: false };
        loaded = true;
        emit();
        return state;
      })
      .catch((error) => {
        state = { ...emptyGym, isLoading: false, loadError: error?.response?.data?.error || error?.message || "Unable to load gym profile" };
        emit();
        return state;
      })
      .finally(() => { loadingPromise = null; });
  }
  return loadingPromise;
}

export async function setGym(gym) {
  const response = await invokeWithAuth("gymAccess", { operation: "updateGymProfile", gym });
  state = { ...emptyGym, ...response.data.gym, isLoading: false };
  loaded = true;
  emit();
  return state;
}

export function resetGymStore() {
  state = { ...emptyGym };
  loaded = false;
  loadingPromise = null;
  emit();
}

export function useGym() {
  useEffect(() => { loadGym(); }, []);
  return useSyncExternalStore(subscribe, getGym, getGym);
}