import { createClient } from "@supabase/supabase-js";

// Public-safe values: this is the publishable key, scoped by Row Level Security.
// Never put a Supabase secret/service-role key in browser code.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://wheeaxbuxpuhgcabcskv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_-17KdS-lO3OhWU4MySOECA_Qydz3ch1";

// Browser SPA auth: persist the session, refresh tokens automatically, and use
// PKCE for OAuth/password-recovery flows. detectSessionInUrl lets supabase-js
// complete the redirect exchange before AuthContext resolves the session.
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
