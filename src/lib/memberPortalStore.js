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
export async function checkInMember() {
  const result = await invoke("memberCheckIn");
  // Reload from the server so the calendar, weekly markers and streak are all
  // derived from the persisted attendance row rather than optimistic UI data.
  await loadMemberPortal(true);
  return result;
}
export async function createMemberFeedback(feedback) {
  const title = String(feedback?.title || "").trim();
  const body = String(feedback?.body || "").trim();
  const type = String(feedback?.type || "Feedback").trim();

  if (!title || !body) {
    throw new Error("Title and details are required");
  }

  // Submit through the gymAccess backend function, which writes with the
  // service role. The direct Supabase client insert depended on the browser
  // session and the member RLS SELECT policy, so it failed for members whose
  // session was not yet detected or whose member row was not self-readable.
  // The backend resolves identity server-side and bypasses RLS entirely.
  await invoke("createFeedback", { feedback: { type, title, body } });

  // Update the local portal immediately. Do not reload unrelated portal data
  // after a successful insert; a secondary read failure must never show a
  // false submission error.
  const createdFeedback = {
    id: `local-${Date.now()}`,
    type,
    title,
    body,
    status: "Pending",
    date: new Date().toISOString().slice(0, 10),
    response: null,
  };
  if (state.data) {
    state = { ...state, data: { ...state.data, feedback: [createdFeedback, ...(state.data.feedback || [])] } };
    emit();
  }

  return createdFeedback;
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