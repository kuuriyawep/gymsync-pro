import React from "react";

// Status pill for the member portal. Tones are alpha-on-token so the same
// badge stays legible in light and dark, unlike a fixed 100/700 pair.
const tones = {
  Paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "Partially Paid": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "Under Review": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "Expiring Soon": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Outstanding: "bg-red-500/15 text-red-600 dark:text-red-400",
  Overdue: "bg-red-500/15 text-red-600 dark:text-red-400",
  Expired: "bg-red-500/15 text-red-600 dark:text-red-400",
  Suspended: "bg-red-500/15 text-red-600 dark:text-red-400",
  Rejected: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export default function PortalPill({ status, className = "" }) {
  if (!status) return null;
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status] || "bg-muted text-muted-foreground"} ${className}`}>
      {status}
    </span>
  );
}