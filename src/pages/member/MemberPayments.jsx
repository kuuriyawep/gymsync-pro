import React, { useState, useEffect } from "react";
import MemberLayout from "@/components/MemberLayout";
import { CreditCard, Clock, Check, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { memberBalance, memberPayments, memberMembership } from "@/lib/memberMockData";

const statusTone = {
  Paid: "bg-black text-white",
  "Partially Paid": "bg-black/10 text-black",
  Outstanding: "bg-black/5 text-black border border-black/15",
  Expired: "bg-black/5 text-black/50",
  "Renewal Due": "bg-black/10 text-black",
};

export default function MemberPayments() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  if (loading) return <MemberLayout title="Payments" back="/member"><div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-black/5 animate-pulse" />)}</div></MemberLayout>;

  return (
    <MemberLayout title="Payments" back="/member">
      <div className="space-y-5">
        {/* Balance card */}
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><CreditCard className="w-5 h-5" /><h3 className="font-semibold">Membership balance</h3></div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone[memberBalance.status]}`}>{memberBalance.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="bg-black/[0.02] rounded-xl p-3"><p className="text-xs text-black/50">Price</p><p className="text-lg font-bold">${memberBalance.price}</p></div>
            <div className="bg-black/[0.02] rounded-xl p-3"><p className="text-xs text-black/50">Paid</p><p className="text-lg font-bold">${memberBalance.paid}</p></div>
            <div className="bg-black/[0.02] rounded-xl p-3"><p className="text-xs text-black/50">Balance</p><p className="text-lg font-bold">${memberBalance.balance}</p></div>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-black/5 pt-3">
            <span className="text-black/50">Renewal date</span>
            <span className="font-semibold">{memberBalance.renewalDate}</span>
          </div>
          <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <RefreshCw className="w-4 h-4" /> Renew membership
          </button>
        </div>

        {/* Status legend */}
        <div className="bg-white border border-black/10 rounded-2xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-3">Payment statuses</h3>
          <div className="flex flex-wrap gap-2">
            {["Paid", "Partially Paid", "Outstanding", "Expired", "Renewal Due"].map((s) => (
              <span key={s} className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusTone[s]}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Payment history */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">Payment history</h3>
          <div className="space-y-2">
            {memberPayments.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center"><Check className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">${p.amount} · {p.method}</p>
                  <p className="text-xs text-black/50">{p.date} · {p.reference}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black text-white">{p.status}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 bg-black/[0.02] rounded-xl p-3">
          <Clock className="w-4 h-4 mt-0.5 text-black/40 shrink-0" />
          <p className="text-xs text-black/50">Payment amounts and balances are confirmed by your gym. If something looks off, please contact the front desk.</p>
        </div>
      </div>
    </MemberLayout>
  );
}