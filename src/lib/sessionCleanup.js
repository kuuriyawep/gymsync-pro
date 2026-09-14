import { queryClientInstance } from "@/lib/query-client";
import { resetMemberStore } from "@/lib/memberStore";
import { resetGymStore } from "@/lib/gymStore";
import { resetMemberPortalStore } from "@/lib/memberPortalStore";

export function clearClientSessionState() {
  resetMemberStore();
  resetGymStore();
  resetMemberPortalStore();
  queryClientInstance.clear();
  localStorage.removeItem("gymsync-read-notifications");
  sessionStorage.removeItem("gymsync_onboarding_draft");
  sessionStorage.removeItem("onboarding_role");
}