import { useEffect, useSyncExternalStore } from "react";
import { base44 } from "@/api/base44Client";

const listeners = new Set();
let state = { data: null, loaded: false, loading: false, error: "" };
let pending = null;
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => state;
const message = (error) => error?.response?.data?.error || error?.message || "Unable to load membership";
async function invoke(operation, payload = {}) {
  const response = await base44.functions.invoke("gymAccess", { operation, ...payload });
  return response.data;
}
export async function loadMemberPortal(force = false) {
  if (state.loaded && !force) return state.data;
  if (pending) return pending;
  state = { ...state, loading: true, error: "" }; emit();
  pending = invoke("memberData").then((result) => { state = { data: result.member, loaded: true, loading: false, error: "" }; emit(); return result.member; }).catch((error) => { state = { data: null, loaded: true, loading: false, error: message(error) }; emit(); return null; }).finally(() => { pending = null; });
  return pending;
}
export async function joinGym(phone, fullName) {
  const result = await invoke("join", { phone, fullName });
  state = { data: result.member, loaded: true, loading: false, error: "" }; emit();
  return result.member;
}
export async function createMemberFeedback(feedback) {
  const result = await invoke("createFeedback", { feedback });
  state = { data: result.member, loaded: true, loading: false, error: "" }; emit();
  return result.member;
}
export function useMemberPortal() {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => { loadMemberPortal(); }, []);
  return value;
}