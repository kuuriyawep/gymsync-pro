import { createClient } from '@supabase/supabase-js';

// Public/publishable config only. The anon key is safe for the browser because
// all access is gated by Row Level Security (see supabase/schema.sql).
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wheeaxbuxpuhgcabcskv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[GymSync] VITE_SUPABASE_ANON_KEY is not set — Supabase calls will fail until it is configured in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = Boolean(supabaseAnonKey);