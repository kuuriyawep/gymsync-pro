import { useEffect, useSyncExternalStore } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";

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
  const { data } = await supabase.auth.getSession();
  const response = await base44.functions.invoke("membersData", { operation, accessToken: data.session?.access_token, ...payload });
  members = response.data.members;
  analytics = response.data.analytics || { payments: [], memberships: [], plans: [], recentActivities: [] };
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