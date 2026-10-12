import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { card } from "@/lib/uiClasses";

const ranges = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "6m", label: "6m" },
  { key: "year", label: "1y" },
];

const tick = (value) => (Number(value) >= 1000 ? `${Number(value) / 1000}k` : String(value));

// Income over the selected window, bucketed by liveGymAnalytics from real
// payment records.
export default function IncomeOverviewChart({ series, range, onRangeChange }) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading font-semibold">Income Overview</h3>
        <div className="flex items-center gap-1 rounded-full border border-border p-1">
          {ranges.map((item) => (
            <button key={item.key} onClick={() => onRangeChange(item.key)} aria-pressed={range === item.key}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${range === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={tick} tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} width={48} />
            <Tooltip contentStyle={{ background: "#121212", border: "1px solid #1e1e1e", borderRadius: 12, fontSize: 12, color: "#fff" }} labelStyle={{ color: "#888888" }} formatter={(value) => [`$${Number(value).toLocaleString()}`, "Income"]} />
            <Area type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2.5} fill="url(#incomeFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}