import { createClient } from "@supabase/supabase-js";

// Public-safe values: this is the publishable (anon) key, scoped entirely by
// Row Level Security — not by secrecy. Same trust model as a Stripe
// publishable key or a Firebase web config. Safe to ship in the client bundle.
// Never put SUPABASE_SERVICE_ROLE_KEY here or anywhere in src/.
//
// Override via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env.example)
// for local dev against a different project or Supabase branch. Both fall
// back to the production project so the app works out of the box in every
// environment (local, Base44 preview, GitHub-built, deployed).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wheeaxbuxpuhgcabcskv.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_-17KdS-lO3OhWU4MySOECA_Qydz3ch1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
