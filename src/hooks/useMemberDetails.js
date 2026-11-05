import { useState, useEffect } from "react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

export function useMemberDetails(memberId) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Drop the previous member's payload immediately. Without this, navigating
    // from Member A to Member B kept A's payments, attendance and activity on
    // screen under B's header until the new request resolved.
    setDetails(null);
    setError(null);

    if (!memberId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    invokeWithAuth("membersData", { operation: "memberDetails", memberId })
      .then((response) => {
        if (cancelled) return;
        setDetails(response.data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.error || e?.message || "Failed to load member details");
        setDetails(null);
        setLoading(false);
      });
    // Cancelling on id change means a slow response for the previous member can
    // never overwrite the member the user is now looking at.
    return () => { cancelled = true; };
  }, [memberId]);

  return { details, loading, error };
}