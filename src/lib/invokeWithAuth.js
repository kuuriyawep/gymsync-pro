import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";

let cachedToken = null;
let tokenPromise = null;

export async function getSupabaseAccessToken() {
  if (cachedToken) return cachedToken;
  if (tokenPromise) return tokenPromise;
  tokenPromise = (async () => {
    try {
      // getSession() may return null right after page reload before the
      // Supabase client has finished restoring the session from storage.
      // Retry a few times to give it a chance to initialize.
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token || null;
        if (token) { cachedToken = token; tokenPromise = null; return token; }
        await new Promise(r => setTimeout(r, 300));
      }
      tokenPromise = null;
      return null;
    } catch {
      tokenPromise = null;
      return null;
    }
  })();
  return tokenPromise;
}

export function clearSupabaseAccessToken() {
  cachedToken = null;
}

export async function getSupabaseUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function invokeWithAuth(functionName, payload = {}) {
  const accessToken = await getSupabaseAccessToken();
  return base44.functions.invoke(functionName, { ...payload, accessToken });
}