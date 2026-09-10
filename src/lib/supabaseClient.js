import { createClient } from '@supabase/supabase-js';

// Public/publishable config only. The anon key is safe for the browser because
// all access is gated by Row Level Security (see supabase/schema.sql).
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
const configuredUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wheeaxbuxpuhgcabcskv.supabase.co';
const supabaseUrl = configuredUrl.replace(/\/?rest\/v1\/?$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-17KdS-lO3OhWU4MySOECA_Qydz3ch1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);