import React, { useState } from "react";
import { Link } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import { ghostBtn, primaryBtn } from "@/lib/uiClasses";
import { loadMemberPortal } from "@/lib/memberPortalStore";
import { ERROR_KINDS, apiErrorInfo } from "@/lib/apiErrors";

/**
 * Shown when the member portal has no data. A missing membership link and a
 * failed request need very different next steps, so they are never presented as
 * the same "join your gym" screen.
 */
export default function MemberDataState({ title = "Home", error }) {
  const [retrying, setRetrying] = useState(false);
  const info = apiErrorInfo(typeof error === "string" ? { message: error } : error || {});
  const isUnlinked = !error || info.kind === ERROR_KINDS.notFound;

  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await loadMemberPortal(true);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <MemberLayout title={title}>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm text-center">
          {isUnlinked ? (
            <>
              <h1 className="text-xl font-heading font-bold">Membership not linked</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error || "Link your registered gym membership to see your information."}</p>
              <Link to="/join-gym" className={`${primaryBtn} mt-5`}>Join your gym</Link>
            </>
          ) : info.kind === ERROR_KINDS.auth ? (
            <>
              <h1 className="text-xl font-heading font-bold">Please sign in again</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your session has expired, so your membership could not be loaded.</p>
              <Link to="/login" className={`${primaryBtn} mt-5`}>Sign in</Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-heading font-bold">Your membership didn't load</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {info.kind === ERROR_KINDS.network
                  ? "You appear to be offline. Check your connection and try again."
                  : info.message || "Please try again."}
              </p>
              {info.retryable ? (
                <button onClick={retry} disabled={retrying} className={`${primaryBtn} mt-5 disabled:opacity-60`}>
                  {retrying ? "Retrying…" : "Try again"}
                </button>
              ) : (
                <Link to="/member" className={`${ghostBtn} mt-5`}>Back to home</Link>
              )}
            </>
          )}
        </div>
      </div>
    </MemberLayout>
  );
}