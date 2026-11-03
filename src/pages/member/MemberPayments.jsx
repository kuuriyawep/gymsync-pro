import React from "react";
import { CreditCard, Check, Clock } from "lucide-react";
import MemberLayout from "@/components/MemberLayout";
import MemberDataState from "@/components/member/MemberDataState";
import PortalPill from "@/components/member/PortalPill";
import { useMemberPortal } from "@/lib/memberPortalStore";

const card = "rounded-2xl border border-border bg-card p-5";

export default function MemberPayments() {
  const { data, loaded, error } = useMemberPortal();

  if (!loaded) {
    return <MemberLayout title="Payments"><div className="h-80 bg-muted animate-pulse rounded-xl" /></MemberLayout>;
  }
  if (!data) return <MemberDataState title="Payments" error={error} />;

  return (
    <MemberLayout title="Payments" back="/member">
      <div className="space-y-5">
        <div className={card}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-semibold"><CreditCard className="w-5 h-5" /> Membership balance</span>
            <PortalPill status={data.balance.status} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xs text-muted-foreground">Price</p><b>${data.balance.price}</b></div>
            <div><p className="text-xs text-muted-foreground">Paid</p><b>${data.balance.paid}</b></div>
            <div><p className="text-xs text-muted-foreground">Balance</p><b>${data.balance.balance}</b></div>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Renewal date</span>
            <b>{data.balance.renewalDate || "—"}</b>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment history</h3>
          {data.payments.length === 0 ? (
            <p className="rounded-xl border border-border py-8 text-center text-sm text-muted-foreground">No payments recorded</p>
          ) : (
            <div className="space-y-2">
              {data.payments.map((payment) => (
                <div key={payment.id} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Check className="w-5 h-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">${payment.amount} · {payment.method}</p>
                    <p className="text-xs text-muted-foreground">{payment.date}{payment.reference ? ` · ${payment.reference}` : ""}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Paid</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 rounded-xl bg-muted p-3">
          <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Payments shown here are the records confirmed by your gym.</p>
        </div>
      </div>
    </MemberLayout>
  );
}