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
  const { data, error } = await supabase.functions.invoke("join-gym", { body: { phone, joinToken } });
  if (error) throw error;
  // The edge function only confirms the link (ids), not the full member
  // record. loadMemberPortal() would normally refresh that via gymAccess,
  // but gymAccess still identifies callers by a Base44 session token, which
  // a Supabase-only member no longer has — that call would fail until the
  // gymAccess/membersData identity bridge is fixed (tracked separately, not
  // done yet). Not calling it here so we fail loudly at that known point
  // instead of masking it; the caller gets gym_id/member_id back directly.
  state = { data: null, loaded: false, loading: false, error: "" };
  emit();
  return data;
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