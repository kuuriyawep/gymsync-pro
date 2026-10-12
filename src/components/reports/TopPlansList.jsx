import React from "react";
import { money } from "@/lib/gymMetrics";
import { card } from "@/lib/uiClasses";

// Membership plans ranked by the income they have actually brought in, with the
// number of members currently on each plan.
export default function TopPlansList({ plans }) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <h3 className="font-heading font-semibold">Top Membership Plans</h3>
      {plans.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No plan income recorded yet.</p>
      ) : (
        <div className="mt-2 divide-y divide-border">
          {plans.map((plan) => (
            <div key={plan.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.count} active</p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{money(plan.revenue)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}