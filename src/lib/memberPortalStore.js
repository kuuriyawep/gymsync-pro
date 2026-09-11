import { useEffect, useSyncExternalStore } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const listeners = new Set();
let state = { data: null, loaded: false, loading: false, error: "", userId: "" };
let pending = null;
let pendingUserId = "";
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => state;
const message = (error) => error?.response?.data?.error || error?.message || "Unable to load membership";
async function invoke(operation, payload = {}) {
  const response = await base44.functions.invoke("gymAccess", { operation, ...payload });
  return response.data;
}
export async function loadMemberPortal(force = false, userId = "") {
  if (state.userId === userId && state.loaded && !force) return state.data;
  if (pending && pendingUserId === userId) return pending;
  state = { data: null, loaded: false, loading: true, error: "", userId }; emit();
  pendingUserId = userId;
  const requestUserId = userId;
  pending = invoke("memberData").then((result) => {
    if (state.userId === requestUserId) { state = { data: result.member, loaded: true, loading: false, error: "", userId: requestUserId }; emit(); }
    return result.member;
  }).catch((error) => {
    if (state.userId === requestUserId) { state = { data: null, loaded: true, loading: false, error: message(error), userId: requestUserId }; emit(); }
    return null;
  }).finally(() => { if (pendingUserId === requestUserId) { pending = null; pendingUserId = ""; } });
  return pending;
}
export async function joinGym(phone, fullName) {
  const result = await invoke("join", { phone, fullName });
  state = { data: result.member, loaded: true, loading: false, error: "" }; emit();
  return result.member;
}
export async function createMemberFeedback(feedback) {
  const result = await invoke("createFeedback", { feedback });
  state = { ...state, data: result.member, loaded: true, loading: false, error: "" }; emit();
  return result.member;
}
export async function markMemberNotificationRead(id) {
  if (!id || !state.data) return;
  const previous = state;
  state = { ...state, data: { ...state.data, notifications: state.data.notifications.map((item) => item.id === id ? { ...item, read: true } : item) } }; emit();
  try {
    const result = await invoke("markNotificationRead", { id });
    if (state.userId === previous.userId) { state = { ...state, data: result.member }; emit(); }
  } catch (error) {
    if (state.userId === previous.userId) { state = previous; emit(); }
    throw error;
  }
}
export function useMemberPortal() {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  const { user } = useAuth();
  const userId = user?.id || "";
  useEffect(() => { if (userId) loadMemberPortal(false, userId); }, [userId]);
  return value.userId === userId ? value : { data: null, loaded: false, loading: true, error: "", userId };
}