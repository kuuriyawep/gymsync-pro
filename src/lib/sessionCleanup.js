import { queryClientInstance } from "@/lib/query-client";
import { resetMemberStore } from "@/lib/memberStore";
import { resetGymStore } from "@/lib/gymStore";
import { resetMemberPortalStore } from "@/lib/memberPortalStore";
import { supabase } from "@/lib/supabaseClient";

export function clearClientSessionState() {
  resetMemberStore();
  resetGymStore();
  resetMemberPortalStore();
  queryClientInstance.clear();
  localStorage.removeItem("gymsync-read-notifications");
  sessionStorage.removeItem("gymsync_onboarding_draft");
  sessionStorage.removeItem("onboarding_role");
}

/**
 * Clears the cached gym/member data whenever the signed-in account changes.
 *
 * Without this, signing in as a different account in the same tab (or a session
 * replaced by another user) left the previous account's members, payments and
 * member portal in memory, so one account could briefly see another's records.
 * Token refreshes keep the same user id and are ignored.
 */
export function watchAuthUserChanges() {
  let currentId;
  let resolved = false;

  supabase.auth
    .getSession()
    .then(({ data }) => {
      currentId = data?.session?.user?.id ?? null;
      resolved = true;
    })
    .catch(() => { resolved = true; });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const nextId = session?.user?.id ?? null;
    if (resolved && currentId !== nextId) clearClientSessionState();
    currentId = nextId;
    resolved = true;
  });

  return () => data?.subscription?.unsubscribe();
}