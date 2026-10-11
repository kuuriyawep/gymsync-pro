import React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import TrendChip from "@/components/TrendChip";
import { money } from "@/lib/gymMetrics";

function BreakdownRow({ label, value, dim }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${dim ? "bg-white/25" : "bg-white"}`} />
        {label}
      </span>
      <span className="text-xs font-semibold tabular-nums">{money(value)}</span>
    </div>
  );
}

export default function RevenueHeroCard({ revenue }) {
  return (
    <div className="col-span-2 flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Monthly Revenue</p>
        <TrendChip value={revenue.change} />
      </div>
      <p className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{money(revenue.total)}</p>
      <div className="-mx-1 mt-2 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenue.sparkline} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={1.5} fill="url(#sparkFill)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        <BreakdownRow label="Membership Payments" value={revenue.membership} />
        <BreakdownRow label="Other Payments" value={revenue.other} dim />
      </div>
    </div>
  );
}