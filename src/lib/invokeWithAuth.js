import { base44 } from "@/api/base44Client";

// All auth is handled by Base44's built-in SDK. Backend functions identify
// the caller via base44.auth.me() — no Supabase token is needed.
//
// The SDK captures the token at client creation time (module load). If the
// token changes after that (e.g. refreshed by another tab, or the initial
// capture missed it), function invocations fail with "Could not validate
// credentials" because the axios client sends a stale or missing token.
// Re-apply the latest token from storage before each call to prevent this.
let lastAppliedToken = null;

export async function invokeWithAuth(functionName, payload = {}) {
  const currentToken = localStorage.getItem("base44_access_token");
  if (currentToken && currentToken !== lastAppliedToken) {
    lastAppliedToken = currentToken;
    base44.setToken(currentToken);
  }
  return base44.functions.invoke(functionName, payload);
}