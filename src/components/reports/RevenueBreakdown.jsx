import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { money } from "@/lib/gymMetrics";
import { card } from "@/lib/uiClasses";

const COLORS = ["#34d399", "#a3e635"];
const label = (value) => String(value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

// Membership vs one-off income for the current month — a payment counts as
// membership income when it was applied to a membership period.
export default function RevenueBreakdown({ breakdown }) {
  const total = breakdown.reduce((sum, item) => sum + item.value, 0);
  const share = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <h3 className="font-heading font-semibold">Revenue Breakdown</h3>
      <div className="relative mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={2} stroke="none">
              {breakdown.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-bold tabular-nums">{money(total)}</p>
          <p className="text-[11px] text-muted-foreground">Total</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {breakdown.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="truncate">{label(item.name)}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{money(item.value)} · {share(item.value)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}