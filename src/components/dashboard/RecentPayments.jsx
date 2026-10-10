import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * @param {{ payments: Array<{ id: string, memberName: string, membershipId: string | null, amount: number, paidAt: string }>, memberships: Array<{ id: string, planId: string }>, plans: Array<{ id: string, name: string }> }} props
 */
export default function RecentPayments({ payments, memberships, plans }) {
  const planByMembership = useMemo(() => {
    const map = new Map();
    (memberships || []).forEach((m) => {
      const plan = (plans || []).find((p) => p.id === m.planId);
      if (plan) map.set(m.id, plan.name);
    });
    return map;
  }, [memberships, plans]);

  const rows = (payments || []).slice(0, 5);

  return (
    <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Payments</h3>
        <Link to="/payments" className="flex items-center gap-1 text-xs font-medium text-black/60 hover:text-black">View all <ArrowRight className="w-3 h-3" /></Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-black/45 py-6 text-center">No payments yet</p>
      ) : (
        <div className="space-y-1">
          {rows.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-black/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.memberName || "Unknown member"}</p>
                <p className="text-xs text-black/40 truncate">{planByMembership.get(p.membershipId) || "—"} · {String(p.paidAt || "").slice(0, 10)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">${Number(p.amount || 0).toLocaleString()}</p>
                <p className="text-xs text-black/40">Paid</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}