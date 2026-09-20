import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";

// Canonical identity is now Supabase Auth. gymAccess/membersData verify the
// caller by fetching the current Supabase access token against Supabase's
// own auth server (see base44/shared/authz.ts) — no Base44 session is
// required or expected for a normal user anymore.
//
// The legacy base44_access_token re-apply below is kept only for any
// still-Base44-authenticated caller (pre-migration staff); it's a no-op once
// nothing sets that token anymore.
export async function invokeWithAuth(functionName, payload = {}) {
  const currentToken = localStorage.getItem("base44_access_token");
  if (currentToken) {
    base44.setToken(currentToken);
  }
  const { data } = await supabase.auth.getSession();
  const supabaseAccessToken = data?.session?.access_token || "";
  return base44.functions.invoke(functionName, { ...payload, _supabaseAccessToken: supabaseAccessToken });
}
