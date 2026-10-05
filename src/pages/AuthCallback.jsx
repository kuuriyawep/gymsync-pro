import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function normalizeNext(value) {
  return value === "member" ? "member" : "owner";
}

export default function AuthCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finishOAuth() {
      try {
        const params = new URLSearchParams(window.location.search);

        // Prefer the intent saved before the OAuth redirect. Keep support for
        // legacy query parameters so older links do not break.
        let storedReturnTo = null;
        try {
          storedReturnTo = window.localStorage.getItem("gymsync.oauth_return_to");
          window.localStorage.removeItem("gymsync.oauth_return_to");
        } catch {
          // Fall back to query params/default below.
        }

        const next = normalizeNext(
          params.get("next") || (storedReturnTo?.includes("next=member") ? "member" : "owner")
        );
        const requestedReturnTo = params.get("returnTo");
        const returnTo = requestedReturnTo
          ? safeReturnToFromValue(requestedReturnTo)
          : storedReturnTo
            ? safeReturnToFromValue(storedReturnTo)
            : "/";

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session?.user) {
          window.location.replace("/login");
          return;
        }

        const userId = data.session.user.id;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, gym_id")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) throw profileError;

        // A member can be linked even if an older auth flow left profiles.gym_id
        // empty. The member row is the final source for membership linkage.
        const { data: member } = await supabase
          .from("members")
          .select("id, gym_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (profile?.role === "member") {
          if (member?.id || profile.gym_id) {
            window.location.replace("/member");
          } else {
            window.location.replace("/join-gym");
          }
          return;
        }

        if (member?.id) {
          window.location.replace("/member");
          return;
        }

        if (profile?.role === "owner" || profile?.role === "staff") {
          window.location.replace(returnTo !== "/" ? returnTo : "/");
          return;
        }

        // New Google users do not have a business role yet.
        // Owners continue through onboarding; members go through Join Gym.
        window.location.replace(next === "member" ? "/join-gym" : "/onboarding");
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "We couldn't finish signing you in.");
      }
    }

    finishOAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.replace("/login")}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-sm text-muted-foreground">Finishing sign in…</p>
    </div>
  );
}

function safeReturnToFromValue(value) {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}
