import React from "react";
import { ChevronRight } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { money } from "@/lib/gymMetrics";

const initials = (name) => String(name || "?").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

// One payment line: member, when it was taken, which plan it belongs to, the
// amount and its derived status. The whole row opens the payment details.
export default function PaymentRow({ payment, onOpen }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent sm:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">{initials(payment.name)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{payment.name}</p>
        <p className="truncate text-xs text-muted-foreground">{payment.memberPhone || payment.paymentId}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">{payment.dateLabel}{payment.timeLabel ? ` · ${payment.timeLabel}` : ""} · {payment.plan}</p>
      </div>
      <div className="hidden w-28 shrink-0 sm:block">
        <p className="text-xs text-foreground">{payment.dateLabel}</p>
        <p className="text-[11px] text-muted-foreground">{payment.timeLabel || payment.method}</p>
      </div>
      <p className="hidden w-20 shrink-0 truncate text-xs text-muted-foreground lg:block">{payment.plan}</p>
      <p className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums sm:w-24">{money(payment.amount)}</p>
      <StatusBadge status={payment.status} />
      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
    </button>
  );
}