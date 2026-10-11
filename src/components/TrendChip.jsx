import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// Shows a real month-over-month change. Renders nothing when there is no
// comparable previous period (rather than inventing a percentage).
export default function TrendChip({ value }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {up ? "+" : ""}{value}%
    </span>
  );
}