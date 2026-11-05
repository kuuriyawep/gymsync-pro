import { useEffect, useSyncExternalStore } from "react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import { Sentry } from "@/lib/sentry";
import { gymToday } from "@/lib/gymTime";

const listeners = new Set();
const emptyAnalytics = () => ({ payments: [], memberships: [], plans: [], trainers: [], recentActivities: [] });

let members = [];
let analytics = emptyAnalytics();
let loaded = false;
let loadError = null;
let loadingPromise = null;
// Two ordering guards for overlapping requests:
// - latestRequest drops a response that a newer request has already superseded,
//   so a slow earlier call can never overwrite fresher server state.
// - version lets a failed mutation roll back only when nothing landed after its
//   optimistic change; otherwise it refetches instead of clobbering the newer
//   snapshot.
let latestRequest = 0;
let version = 0;

function emit() { listeners.forEach((listener) => listener()); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return members; }
function getAnalyticsSnapshot() { return analytics; }
function getLoadedSnapshot() { return loaded; }
function getLoadErrorSnapshot() { return loadError; }

async function run(operation, payload = {}) {
  const requestId = ++latestRequest;
  try {
    const response = await invokeWithAuth("membersData", { operation, ...payload });
    if (requestId < latestRequest) {
      // A newer request has already applied a fresher snapshot — keep it.
      return response.data.members;
    }
    members = response.data.members;
    analytics = response.data.analytics || emptyAnalytics();
    loadError = null;
    loaded = true;
    version += 1;
    emit();
    return members;
  } catch (e) {
    loadError = e?.response?.data?.error || e?.message || "Failed to load gym data";
    loaded = true;
    emit();
    // Caught here and shown as a toast/banner in the UI — which means it
    // never reaches Sentry's automatic handlers unless explicitly reported.
    // This single choke point covers every members/payments/plans operation.
    Sentry.captureException(e, { tags: { operation }, extra: { payload } });
    throw e;
  }
}

/**
 * Applies a change locally first and returns a rollback function. Mutations
 * call this so the list updates the moment the user saves, then either
 * reconcile with the server payload or revert to the previous snapshot when
 * the request fails.
 */
function optimisticApply(apply) {
  const previous = { members, analytics };
  const next = apply(previous);
  if (next) {
    members = next.members ?? previous.members;
    analytics = next.analytics ?? previous.analytics;
    version += 1;
    emit();
  }
  const appliedAt = version;
  return () => {
    // If another response landed after this optimistic change, restoring the
    // old snapshot would throw away newer server data. Refetch instead.
    if (version !== appliedAt) {
      loadMembers(true).catch(() => undefined);
      return;
    }
    members = previous.members;
    analytics = previous.analytics;
    version += 1;
    emit();
  };
}

async function mutate(apply, operation, payload) {
  const rollback = optimisticApply(apply);
  try {
    return await run(operation, payload);
  } catch (error) {
    rollback();
    throw error;
  }
}

const toAmount = (value, fallback) => {
  const parsed = Number(value);
  return value === "" || value === null || value === undefined || !Number.isFinite(parsed) ? fallback : parsed;
};

const paymentStateFor = (fee, paid) => {
  if (!Number.isFinite(fee) || fee <= 0) return "Paid";
  if (Number(paid) >= fee) return "Paid";
  return Number(paid) > 0 ? "Pending" : "Overdue";
};

export function loadMembers(force = false) {
  // Only skip a refetch if the last attempt actually succeeded — a failed
  // load still sets loaded=true (so the UI can stop showing a skeleton and
  // show the real error instead), but must not block a natural retry on the
  // next mount/navigation the way a plain `loaded` check would.
  if (loaded && !force && !loadError) return Promise.resolve(members);
  if (!loadingPromise) loadingPromise = run("bootstrap").finally(() => { loadingPromise = null; });
  return loadingPromise;
}

export function addMember(member) {
  const fee = toAmount(member.amount, 0);
  const paid = toAmount(member.amountPaid, 0);
  return mutate(({ members: list }) => ({
    members: [
      {
        id: `optimistic-${Date.now()}`,
        memberId: "Pending",
        name: member.name,
        phone: member.phone,
        email: member.email || "",
        gender: member.gender || "",
        plan: member.plan,
        status: member.status || "Active",
        paymentStatus: paymentStateFor(fee, paid),
        registeredDate: member.startDate || gymToday(),
        startDate: member.startDate,
        expiryDate: member.expiryDate,
        fee,
        amountPaid: paid,
        balance: Math.max(0, fee - paid),
        note: member.note || "",
        preferredTime: member.preferredTime || "Flexible",
        photoUrl: member.photoUrl || null,
        pending: true,
      },
      ...list,
    ],
  }), "create", { member });
}

export function updateMember(id, member) {
  return mutate(({ members: list }) => ({
    members: list.map((item) => (String(item.id) !== String(id) ? item : (() => {
      const fee = toAmount(member.amount, item.fee);
      const paid = toAmount(member.amountPaid, item.amountPaid);
      return {
        ...item,
        name: member.name,
        phone: member.phone,
        email: member.email || "",
        gender: member.gender || item.gender,
        plan: member.plan,
        status: member.status,
        startDate: member.startDate || item.startDate,
        expiryDate: member.expiryDate,
        fee,
        amountPaid: paid,
        balance: Math.max(0, fee - paid),
        paymentStatus: paymentStateFor(fee, paid),
        note: member.note || "",
        preferredTime: member.preferredTime || item.preferredTime,
        photoUrl: member.photoUrl || null,
        pending: true,
      };
    })())),
  }), "update", { id, member });
}

export function renewMember(id, member) {
  return mutate(({ members: list }) => ({
    members: list.map((item) => (String(item.id) !== String(id) ? item : (() => {
      const fee = toAmount(member.amount, item.fee);
      const paid = toAmount(member.amountPaid, item.amountPaid);
      return {
        ...item,
        plan: member.plan || item.plan,
        startDate: member.startDate || item.startDate,
        expiryDate: member.expiryDate,
        status: "Active",
        fee,
        amountPaid: paid,
        balance: Math.max(0, fee - paid),
        paymentStatus: paymentStateFor(fee, paid),
        pending: true,
      };
    })())),
  }), "renew", { id, member });
}

export function deleteMember(id) { return run("delete", { id }); }

export function recordPayment(payment) {
  return mutate(({ analytics: stats }) => ({
    analytics: {
      ...stats,
      payments: [
        {
          id: `optimistic-${Date.now()}`,
          memberId: payment.memberId,
          memberName: payment.name,
          amount: toAmount(payment.amount, 0),
          method: payment.method,
          paidAt: payment.date ? `${payment.date}T00:00:00` : new Date().toISOString(),
          note: payment.notes || "",
          pending: true,
        },
        ...(stats.payments || []),
      ],
    },
  }), "recordPayment", { payment });
}

export function updatePayment(payment) { return run("updatePayment", { id: payment.id, amount: payment.amount, method: payment.method, date: payment.date, notes: payment.notes }); }
export function createMembershipPlan(plan) { return run("createPlan", { plan }); }
export function updateMembershipPlan(id, plan) { return run("updatePlan", { id, plan }); }
export function toggleMembershipPlan(id) { return run("togglePlan", { id }); }
export function getMembers() { return members; }
export function setMembers(next) { members = typeof next === "function" ? next(members) : next; emit(); }
export function resetMemberStore() {
  members = [];
  analytics = emptyAnalytics();
  loaded = false;
  loadError = null;
  loadingPromise = null;
  latestRequest += 1;
  version += 1;
  emit();
}

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