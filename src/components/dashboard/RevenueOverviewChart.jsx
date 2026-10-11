import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/gymMetrics";

const ranges = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
];
const rangeLabels = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };

export default function RevenueOverviewChart({ series, range, onRangeChange, currency }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold">Revenue Overview</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{rangeLabels[range] || "Last 30 days"} · {currency}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border p-0.5">
          {ranges.map((item) => (
            <button
              key={item.key}
              onClick={() => onRangeChange(item.key)}
              aria-pressed={range === item.key}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${range === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="-ml-2 mt-4 h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={26} />
            <YAxis tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} tickFormatter={(value) => (value >= 1000 ? `$${value / 1000}k` : `$${value}`)} />
            <Tooltip
              contentStyle={{ background: "#121212", border: "1px solid #1e1e1e", borderRadius: 12, fontSize: 12, color: "#ffffff" }}
              labelStyle={{ color: "#888888" }}
              formatter={(value) => [money(value), "Revenue"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2} fill="url(#revenueFill)" dot={false} activeDot={{ r: 3.5, fill: "#ffffff" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}