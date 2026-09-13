import { useState, useEffect } from "react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

export function useMemberDetails(memberId) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!memberId) {
      setLoading(false);
      setError(null);
      setDetails(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    invokeWithAuth("membersData", { operation: "memberDetails", memberId })
      .then((response) => {
        if (cancelled) return;
        setDetails(response.data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.error || e?.message || "Failed to load member details");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [memberId]);

  return { details, loading, error };
}