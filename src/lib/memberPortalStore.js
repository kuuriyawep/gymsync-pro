import { useEffect, useSyncExternalStore } from "react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import { supabase } from "@/lib/supabaseClient";

const listeners = new Set();
let state = { data: null, loaded: false, loading: false, error: "" };
let pending = null;
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => state;
const message = (error) => error?.response?.data?.error || error?.message || "Unable to load membership";
async function invoke(operation, payload = {}) {
  const response = await invokeWithAuth("gymAccess", { operation, ...payload });
  return response.data;
}
export async function loadMemberPortal(force = false) {
  if (state.loaded && !force) return state.data;
  if (pending) return pending;
  state = { ...state, loading: true, error: "" }; emit();
  pending = invoke("memberData").then((result) => { state = { data: result.member, loaded: true, loading: false, error: "" }; emit(); return result.member; }).catch((error) => { state = { data: null, loaded: true, loading: false, error: message(error) }; emit(); return null; }).finally(() => { pending = null; });
  return pending;
}
export async function joinGym(phone, joinToken) {
  // Use the same Base44 backend gateway already used by the member portal.
  // This avoids a browser-side direct Edge Function call, which can surface
  // generic CORS/platform errors even when the function itself is healthy.
  const response = await invokeWithAuth("gymAccess", {
    operation: "join",
    phone,
    joinToken,
  });
  const data = response?.data;
  if (!data?.success) throw new Error(data?.error || "Membership verification failed");

  // The join operation links the authenticated Supabase user to the real
  // member record. Refresh the portal through the normal authenticated path.
  state = { data: null, loaded: false, loading: false, error: "" };
  emit();
  const member = await loadMemberPortal(true);
  if (!member) throw new Error(state.error || "Membership linked but could not be loaded");
  return { ...data, member };
}
export async function createMemberFeedback(feedback) {
  const result = await invoke("createFeedback", { feedback });
  state = { data: result.member, loaded: true, loading: false, error: "" }; emit();
  return result.member;
}
export function resetMemberPortalStore() {
  state = { data: null, loaded: false, loading: false, error: "" };
  pending = null;
  emit();
}
export function useMemberPortal() {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => { loadMemberPortal(); }, []);
  return value;
}