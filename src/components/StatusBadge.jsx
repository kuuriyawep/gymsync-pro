import React from "react";

const tones = {
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger: "bg-red-500/15 text-red-400",
  neutral: "bg-slate-500/20 text-slate-300",
};

const statusTone = {
  Active: "success",
  Paid: "success",
  "Expiring Soon": "warning",
  Partial: "warning",
  Expired: "danger",
  Overdue: "danger",
  Suspended: "danger",
  Pending: "neutral",
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[statusTone[status] || "neutral"]}`}>
      {status}
    </span>
  );
}