import React from "react";
import TrendChip from "@/components/TrendChip";

export default function MemberMetricCards({ metrics }) {
  const cards = [
    { label: "Total Members", value: metrics.total, change: metrics.totalChange },
    { label: "Active", value: metrics.active, change: metrics.activeChange },
    { label: "Expiring Soon", value: metrics.expiring, change: metrics.expiringChange },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">{card.label}</p>
          <p className="mt-1.5 font-heading text-xl font-bold leading-none tracking-tight sm:text-2xl">{Number(card.value || 0).toLocaleString()}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TrendChip value={card.change} />
            <span className="text-[10px] text-muted-foreground sm:text-[11px]">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}