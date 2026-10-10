import React from "react";

/**
 * Minimal inline SVG sparkline — no axes, no grid, just the trend line.
 * @param {{ values: number[], className?: string }} props
 */
function Sparkline({ values, className = "" }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * @param {{ revenue: number, periodLabel: string, sparkValues: number[], comparison: number | null }} props
 */
export default function RevenueHeroCard({ revenue, periodLabel, sparkValues, comparison }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 md:p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-3xl md:text-4xl font-bold tracking-tight mt-1">${Number(revenue || 0).toLocaleString()}</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 mt-1">{periodLabel}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="flex-1 h-9 text-accent-revenue min-w-0"><Sparkline values={sparkValues} className="w-full h-full" /></div>
        {comparison !== null && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${comparison >= 0 ? "bg-accent-revenue text-white" : "bg-destructive/15 text-destructive"}`}>
            {comparison >= 0 ? "+" : ""}{comparison}% vs prev
          </span>
        )}
      </div>
    </div>
  );
}