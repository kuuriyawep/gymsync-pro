import React from "react";
import { Clock, CreditCard, TrendingDown, TrendingUp, UserPlus, Wallet } from "lucide-react";
import { card } from "@/lib/uiClasses";

const icons = { income: Wallet, members: UserPlus, payments: CreditCard, expiring: Clock };

// Month-over-month performance for the gym, calculated from real payment and
// membership records.
export default function ReportKpiRow({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = icons[item.key] || Wallet;
        const change = item.change;
        return (
          <div key={item.key} className={`${card} p-4`}>
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><Icon className="w-4 h-4" /></span>
              {change !== null && change !== undefined && (
                <span className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {change > 0 ? "+" : ""}{change}%
                </span>
              )}
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">vs last month</p>
          </div>
        );
      })}
    </div>
  );
}