import React from "react";
import TrendChip from "@/components/TrendChip";

export default function MiniStatCard({ label, value, change }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[11px] font-medium leading-tight text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
        <span className="font-heading text-xl font-bold leading-none tracking-tight sm:text-2xl">{Number(value || 0).toLocaleString()}</span>
        <TrendChip value={change} />
      </div>
    </div>
  );
}