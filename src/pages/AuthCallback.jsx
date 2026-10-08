import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

function normalizeNext(value) {
  if (value === "member") return "member";
  if (value === "staff") return "staff";
  return "owner";
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
        let storedIntent = null;
        try {
          const rawIntent = window.localStorage.getItem("gymsync.oauth_intent");
          window.localStorage.removeItem("gymsync.oauth_intent");
          storedIntent = rawIntent ? JSON.parse(rawIntent) : null;
        } catch {
          // Fall back to query params/default below.
        }

        const next = normalizeNext(
          params.get("next") || storedIntent?.next || "owner"
        );
        const requestedReturnTo = params.get("returnTo");
        const returnTo = requestedReturnTo
          ? safeReturnToFromValue(requestedReturnTo)
          : storedIntent?.returnTo
            ? safeReturnToFromValue(storedIntent.returnTo)
            : "/";

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session?.user) {
          window.location.replace("/login");
          return;
        }

        const { data: access } = await invokeWithAuth("gymAccess", {
          operation: "resolveRole",
        });
        const resolvedRole = access?.data?.role || access?.role || null;

        if (cancelled) return;

        if (resolvedRole === "member") {
          window.location.replace("/member");
          return;
        }

        if (resolvedRole === "staff" || resolvedRole === "owner") {
          window.location.replace(returnTo !== "/" ? returnTo : "/");
          return;
        }

        // New users without a business role continue through the correct
        // onboarding/join flow.
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
