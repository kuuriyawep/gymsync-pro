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

// Maximum number of retry attempts after the initial try (2 retries = 3 total attempts).
const MAX_RETRIES = 2;
// Delay before the Nth retry (0-indexed): 500ms, 1500ms.
const RETRY_DELAYS_MS = [500, 1500];

// Returns true only for network-level failures where no HTTP response was
// received (XHR status 0). These are safe to retry because the request never
// reached the server. HTTP 4xx/5xx errors (where error.response is defined)
// are intentional server replies and must not be retried.
function isNetworkError(error) {
  return error && error.response === undefined && (error.code === "ERR_NETWORK" || error.message === "Network Error" || !error.status);
}

export async function invokeWithAuth(functionName, payload = {}) {
  const currentToken = localStorage.getItem("base44_access_token");
  if (currentToken) {
    base44.setToken(currentToken);
  }

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Wait before retrying, then refresh the Supabase session — the token
      // may have expired or been invalidated during the network outage window.
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
    }

    const { data } = await supabase.auth.getSession();
    const supabaseAccessToken = data?.session?.access_token || "";

    try {
      return await base44.functions.invoke(functionName, { ...payload, _supabaseAccessToken: supabaseAccessToken });
    } catch (error) {
      if (!isNetworkError(error) || attempt === MAX_RETRIES) {
        // Not a retriable network error, or we've exhausted all retries —
        // re-throw so callers handle it as they normally would.
        throw error;
      }
      lastError = error;
    }
  }

  // Unreachable, but satisfies linters that expect all paths to return/throw.
  throw lastError;
}
