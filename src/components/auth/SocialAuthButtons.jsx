import React, { useState } from "react";
import { Apple, Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { supabase } from "@/lib/supabaseClient";

const PRODUCTION_APP_ORIGIN = "https://gym-sync-pro-634080e3.base44.app";

function getOAuthRedirectUrl() {
  // Never derive this from window.location.origin: inside the Base44 Editor
  // that origin is app.base44.com, which is not the production app callback.
  // Use the deployed app origin explicitly for every Google/Apple OAuth flow.
  const appOrigin = (import.meta.env.VITE_BASE44_APP_BASE_URL || PRODUCTION_APP_ORIGIN).replace(/\/$/, "");
  return new URL("/auth/callback", appOrigin).toString();
}

export default function SocialAuthButtons({ redirectTo, onError }) {
  const [loading, setLoading] = useState("");

  const connect = async (provider) => {
    setLoading(provider);
    onError("");
    // Open a blank tab synchronously during the user click. This avoids
    // cross-origin access to window.top and reduces popup-blocker issues when
    // Base44 Preview hosts the app in a cross-origin iframe.
    let authWindow = null;
    try {
      authWindow = window.open("about:blank", "_blank");
    } catch {
      authWindow = null;
    }
    try {
      const destination = redirectTo || "/";
      // OAuth providers return to the exact allow-listed callback. Persist the
      // intended destination locally instead of putting query parameters on
      // redirectTo, which can fail an exact Supabase redirect-URL match.
      try {
        const intentUrl = new URL(destination, window.location.origin);
        const next = intentUrl.searchParams.get("next") || "";
        const returnTo = intentUrl.searchParams.get("returnTo") || "";
        window.localStorage.setItem(
          "gymsync.oauth_intent",
          JSON.stringify({ next, returnTo })
        );
      } catch {
        // localStorage may be unavailable in privacy-restricted browsers;
        // AuthCallback safely falls back to the default route.
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthRedirectUrl(),
              // Open the provider URL ourselves so OAuth can run outside the
          // Base44 Preview iframe. We create the tab synchronously above.
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("The sign-in provider did not return an authorization URL.");
      // Do not read or write window.top: it is cross-origin in Base44 Preview
      // and causes a SecurityError. Navigate the newly opened tab instead.
      if (authWindow && !authWindow.closed) {
        authWindow.location.href = data.url;
      } else {
        throw new Error("Your browser blocked the Google sign-in window. Open GymSync using its published app URL in Safari, then try again.");
      }
      // Navigation begins in the provider tab; keep loading active.
    } catch (error) {
      try { if (authWindow && !authWindow.closed) authWindow.close(); } catch { /* ignore cross-origin close errors */ }
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
