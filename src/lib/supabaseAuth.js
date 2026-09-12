import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabaseClient';

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password, fullName = '') {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithProvider(provider, redirectTo) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function getSocialProviders() {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseAnonKey } });
  if (!response.ok) throw new Error('Unable to check social sign-in');
  const settings = await response.json();
  return { google: Boolean(settings?.external?.google), apple: Boolean(settings?.external?.apple) };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}