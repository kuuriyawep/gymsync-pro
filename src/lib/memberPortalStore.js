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
export async function joinGym(phone, fullName) {
  // Make the member-link request explicit about the current Supabase session.
  // This avoids intermittent 401/authentication_required failures after OAuth
  // redirects or when the browser has not refreshed the session yet.
  let { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData?.session ?? null;

  if (!session) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw new Error("Your sign-in session expired. Please sign in again.");
    session = refreshed?.session ?? null;
  }

  if (!session?.access_token) {
    throw new Error("Your sign-in session is missing. Please sign in again before joining the gym.");
  }

  const { data, error } = await supabase.functions.invoke("join-gym", {
    body: { phone, fullName },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    if (error.context) {
      try {
        const details = await error.context.json();
        throw new Error(details?.error || error.message || "Membership verification failed");
      } catch (contextError) {
        if (contextError instanceof Error && contextError.message !== error.message) throw contextError;
      }
    }
    throw new Error(error.message || "Membership verification failed");
  }

  if (!data?.success) throw new Error(data?.error || "Membership verification failed");

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