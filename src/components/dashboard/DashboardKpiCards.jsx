import React from "react";

/** @type {{ key: "active" | "expired" | "pending", label: string }[]} */
const kpiDefs = [
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
  { key: "pending", label: "Pending" },
];

/**
 * @param {{ active: number, expired: number, pending: number }} props
 */
export default function DashboardKpiCards({ active, expired, pending }) {
  const values = { active, expired, pending };
  return (
    <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
      {kpiDefs.map((kpi) => (
        <div key={kpi.key} className="bg-white border border-black/10 rounded-xl p-4 lg:p-5 flex flex-col justify-center lg:justify-start">
          <p className="text-2xl lg:text-3xl font-bold tracking-tight">{Number(values[kpi.key] || 0).toLocaleString()}</p>
          <p className="text-xs text-black/50 mt-0.5">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}