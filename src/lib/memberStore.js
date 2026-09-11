import { useEffect, useSyncExternalStore } from "react";
import { gymData } from "@/lib/gymDataClient";

const listeners = new Set();
let members = [];
let analytics = { payments: [], memberships: [], plans: [], recentActivities: [] };
let loaded = false;
let loadingPromise = null;

function emit() { listeners.forEach((listener) => listener()); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return members; }
function getAnalyticsSnapshot() { return analytics; }
function getLoadedSnapshot() { return loaded; }

async function run(operation, payload = {}) {
  const response = await gymData(operation, payload);
  if (response.members) members = response.members;
  if (response.analytics) analytics = response.analytics;
  loaded = true;
  emit();
  return members;
}

export function loadMembers(force = false) {
  if (loaded && !force) return Promise.resolve(members);
  if (!loadingPromise) loadingPromise = run("bootstrap").finally(() => { loadingPromise = null; });
  return loadingPromise;
}

export function addMember(member) { return run("create", { member }); }
export function updateMember(id, member) { return run("update", { id, member }); }
export function deleteMember(id) { return run("delete", { id }); }
export async function recordPayment(payment) { const response = await gymData("recordPayment", { payment }); members = response.members || members; analytics = response.analytics || analytics; loaded = true; emit(); return analytics; }
export async function createMembershipPlan(plan) { const plans = await gymData("createPlan", { plan }); analytics = { ...analytics, plans }; emit(); return plans; }
export async function updateMembershipPlan(id, plan) { const plans = await gymData("updatePlan", { id, plan }); analytics = { ...analytics, plans }; emit(); return plans; }
export async function toggleMembershipPlan(id) { const plans = await gymData("togglePlan", { id }); analytics = { ...analytics, plans }; emit(); return plans; }
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
