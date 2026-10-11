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

  // Feedback is a normal member-owned Supabase row, so write it directly with
  // the current Supabase Auth session. The previous Base44 function path could
  // return a generic 500 even when the database insert had already succeeded.
  const memberId = state.data?.profile?.id;
  if (!memberId) throw new Error("Your membership session is not ready. Please refresh and try again.");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    throw new Error("Your sign-in session has expired. Please sign in again.");
  }

  const { data: memberRow, error: memberError } = await supabase
    .from("members")
    .select("id,gym_id")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) throw new Error(memberError.message || "Could not verify your membership.");
  if (!memberRow?.gym_id) throw new Error("Your gym membership is not linked correctly.");

  const typeMap = {
    Feedback: "feedback",
    Complaint: "complaint",
    "Feature Request": "feature_request",
    "Machine Request": "machine_request",
    "Coach Request": "coach_request",
  };

  // Insert without requesting the inserted row back. The member RLS policy
  // allows the write, but a PostgREST INSERT ... RETURNING can be filtered by
  // the SELECT policy and then .single() turns that successful write into a
  // misleading 400/500-style error. The gymAccess service path already reads
  // feedback with the service role, so the next portal refresh can load it.
  const { error: insertError } = await supabase
    .from("feedback_requests")
    .insert({
      gym_id: memberRow.gym_id,
      member_id: memberId,
      user_id: userData.user.id,
      channel: "gym",
      type: typeMap[type] || "feedback",
      subject: title,
      message: body,
      status: "open",
      priority: "normal",
    });

  if (insertError) {
    throw new Error(insertError.message || "Your request could not be submitted.");
  }

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