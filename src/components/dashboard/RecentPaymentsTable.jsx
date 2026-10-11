import React from "react";
import StatusBadge from "@/components/StatusBadge";
import { money } from "@/lib/gymMetrics";

const initials = (name) => String(name || "?").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

export default function RecentPaymentsTable({ payments }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3.5 sm:px-5">
        <h3 className="font-heading font-semibold">Recent Payments</h3>
      </div>
      {payments.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">No payments recorded yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium sm:px-5">Member</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-border">
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold">{initials(payment.memberName)}</span>
                      <span className="whitespace-nowrap font-medium">{payment.memberName}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{payment.date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{payment.plan}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">{money(payment.amount)}</td>
                  <td className="px-4 py-3 text-right sm:px-5"><StatusBadge status={payment.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}