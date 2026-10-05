import React, { useState } from "react";
import { Apple, Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { supabase } from "@/lib/supabaseClient";

const PRODUCTION_APP_ORIGIN = "https://gym-sync-pro-634080e3.base44.app";

function getOAuthRedirectUrl(destination) {
  // Always return OAuth to the published app, never to a Base44 editor/preview
  // origin. This prevents Google/Apple from falling back to the builder UI when
  // auth is initiated from a preview surface.
  const path = new URL(destination || "/", PRODUCTION_APP_ORIGIN);
  return path.toString();
}

export default function SocialAuthButtons({ redirectTo, onError }) {
  const [loading, setLoading] = useState("");

  const connect = async (provider) => {
    setLoading(provider);
    onError("");
    try {
      const destination = redirectTo || "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthRedirectUrl(destination),
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
