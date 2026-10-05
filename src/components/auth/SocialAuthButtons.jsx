import React, { useState } from "react";
import { Apple, Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { supabase } from "@/lib/supabaseClient";

const PRODUCTION_APP_ORIGIN = "https://gym-sync-pro-634080e3.base44.app";

function getOAuthRedirectUrl() {
  // Keep the OAuth callback URL exact and stable. Supabase's redirect allow-list
  // is configured for this path; the requested destination is stored locally
  // before leaving for Google/Apple and restored by AuthCallback.
  return new URL("/auth/callback", PRODUCTION_APP_ORIGIN).toString();
}

export default function SocialAuthButtons({ redirectTo, onError }) {
  const [loading, setLoading] = useState("");

  const connect = async (provider) => {
    setLoading(provider);
    onError("");
    try {
      const destination = redirectTo || "/";
      // OAuth providers return to the exact allow-listed callback. Persist the
      // intended destination locally instead of putting query parameters on
      // redirectTo, which can fail an exact Supabase redirect-URL match.
      try {
        window.localStorage.setItem("gymsync.oauth_return_to", destination);
      } catch {
        // localStorage may be unavailable in privacy-restricted browsers;
        // AuthCallback safely falls back to the default route.
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthRedirectUrl(),
        },
      });
      if (error) throw error;
      // On success the browser navigates away to the provider immediately;
      // loading state intentionally isn't cleared here.
    } catch (error) {
      onError(error.message || `${provider} sign-in is unavailable`);
      setLoading("");
    }
  };

  const button = (provider, label, Icon) => (
    <button type="button" onClick={() => connect(provider)} disabled={Boolean(loading)} className="w-full h-12 flex items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium disabled:opacity-60">
      {loading === provider ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
      Continue with {label}
    </button>
  );

  return <div className="grid gap-3 mb-6">{button("google", "Google", GoogleIcon)}{button("apple", "Apple", Apple)}</div>;
}
