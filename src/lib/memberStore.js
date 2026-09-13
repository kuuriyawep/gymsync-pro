import { useEffect, useSyncExternalStore } from "react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

const listeners = new Set();
let members = [];
let analytics = { payments: [], memberships: [], plans: [], recentActivities: [] };
let loaded = false;
let loadError = null;
let loadingPromise = null;

function emit() { listeners.forEach((listener) => listener()); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return members; }
function getAnalyticsSnapshot() { return analytics; }
function getLoadedSnapshot() { return loaded; }
function getLoadErrorSnapshot() { return loadError; }

async function run(operation, payload = {}) {
  try {
    const response = await invokeWithAuth("membersData", { operation, ...payload });
    members = response.data.members;
    analytics = response.data.analytics || { payments: [], memberships: [], plans: [], recentActivities: [] };
    loadError = null;
    loaded = true;
    emit();
    return members;
  } catch (e) {
    loadError = e?.response?.data?.error || e?.message || "Failed to load gym data";
    loaded = true;
    emit();
    throw e;
  }
}

export function loadMembers(force = false) {
  if (loaded && !force) return Promise.resolve(members);
  if (!loadingPromise) loadingPromise = run("bootstrap").finally(() => { loadingPromise = null; });
  return loadingPromise;
}

export function addMember(member) { return run("create", { member }); }
export function updateMember(id, member) { return run("update", { id, member }); }
export function deleteMember(id) { return run("delete", { id }); }
export function recordPayment(payment) { return run("recordPayment", { payment }); }
export function createMembershipPlan(plan) { return run("createPlan", { plan }); }
export function updateMembershipPlan(id, plan) { return run("updatePlan", { id, plan }); }
export function toggleMembershipPlan(id) { return run("togglePlan", { id }); }
export function getMembers() { return members; }
export function setMembers(next) { members = typeof next === "function" ? next(members) : next; emit(); }

export function useMembers() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => { loadMembers(); }, []);
  return snapshot;
}

export function useGymAnalytics() {
  const snapshot = useSyncExternalStore(subscribe, getAnalyticsSnapshot, getAnalyticsSnapshot);
  useEffect(() => { loadMembers(); }, []);
  return snapshot;
}

export function useMembersLoaded() {
  return useSyncExternalStore(subscribe, getLoadedSnapshot, getLoadedSnapshot);
}

export function useMembersError() {
  return useSyncExternalStore(subscribe, getLoadErrorSnapshot, getLoadErrorSnapshot);
}