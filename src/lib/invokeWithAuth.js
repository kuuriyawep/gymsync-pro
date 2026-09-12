import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";

let cachedToken = null;
let tokenPromise = null;

export async function getSupabaseAccessToken() {
  if (cachedToken) return cachedToken;
  if (tokenPromise) return tokenPromise;
  tokenPromise = supabase.auth.getSession().then(({ data }) => {
    const token = data?.session?.access_token || null;
    cachedToken = token;
    tokenPromise = null;
    return token;
  }).catch(() => { tokenPromise = null; return null; });
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