import React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CalendarDays, CreditCard, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { money } from "@/lib/gymMetrics";
import { card } from "@/lib/uiClasses";

// Revenue for the month split the way the owner thinks about it: what came in
// through memberships, what came in from one-off payments, and what is still
// owed. Every number is a sum over real payment records.
export default function PaymentsSummary({ metrics, pendingCount, overdueCount, rangeLabel }) {
  const change = metrics.change;
  const share = (value) => (metrics.total > 0 ? Math.round((value / metrics.total) * 100) : 0);
  const subCards = [
    { label: "Membership Payments", value: money(metrics.membership), meta: `${share(metrics.membership)}% of total`, icon: CreditCard },
    { label: "One-time Payments", value: money(metrics.other), meta: `${share(metrics.other)}% of total`, icon: Wallet },
    { label: "Pending Payments", value: String(pendingCount), meta: overdueCount > 0 ? `${overdueCount} overdue` : "Need attention", icon: CalendarDays, span: "col-span-2 lg:col-span-1" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className={`${card} col-span-2 p-4 sm:p-5`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-muted-foreground">Total Revenue (This Month)</p>
          <span className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" /> {rangeLabel}
          </span>
        </div>
        <p className="mt-2 font-heading text-3xl font-bold tabular-nums sm:text-4xl">{money(metrics.total)}</p>
        {change !== null && (
          <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change > 0 ? "+" : ""}{change}% vs last month
          </p>
        )}
        <div className="mt-3 h-14">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.sparkline} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="paymentsSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} fill="url(#paymentsSpark)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {subCards.map((item) => (
        <div key={item.label} className={`${card} ${item.span || ""} p-4`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><item.icon className="w-4 h-4" /></span>
          <p className="mt-2 text-lg font-bold tabular-nums sm:text-xl">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.meta}</p>
        </div>
      ))}
    </div>
  );
}