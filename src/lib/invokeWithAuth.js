import { base44 } from "@/api/base44Client";

// All auth is handled by Base44's built-in SDK. Backend functions identify
// the caller via base44.auth.me() — no Supabase token is needed.
export async function invokeWithAuth(functionName, payload = {}) {
  return base44.functions.invoke(functionName, payload);
}