import React from "react";
import { Link } from "react-router-dom";
import { Flame, CreditCard, CalendarCheck, ArrowRight, MessageSquare } from "lucide-react";
import MemberLayout from "@/components/MemberLayout";
import MemberDataState from "@/components/member/MemberDataState";
import PortalPill from "@/components/member/PortalPill";
import { useMemberPortal } from "@/lib/memberPortalStore";
import { membershipProgress, attendanceSummary } from "@/lib/memberPortalUtils";

const card = "rounded-2xl border border-border bg-card p-5";

export default function MemberDashboard() {
  const { data, loaded, error } = useMemberPortal();

  if (!loaded) {
    return (
      <MemberLayout>
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
      </MemberLayout>
    );
  }
  if (!data) return <MemberDataState error={error} />;

  const progress = membershipProgress(data.membership.startDate, data.membership.expiryDate);
  const attendance = attendanceSummary(data.attendance, data.attendanceStartDate);
  const messages = data.messages || [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <MemberLayout>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl font-heading font-bold">{data.profile.name}</h1>
        </div>

        <div className={card}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Membership</p>
              <p className="text-lg font-bold truncate">{data.membership.plan}</p>
            </div>
            <PortalPill status={data.membership.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 my-4">
            <div><p className="text-xs text-muted-foreground">Start date</p><b className="text-sm">{data.membership.startDate || "—"}</b></div>
            <div><p className="text-xs text-muted-foreground">Expiry date</p><b className="text-sm">{data.membership.expiryDate || "—"}</b></div>
          </div>
          <p className="text-xs text-muted-foreground mb-1.5">{progress.remaining} days remaining · {progress.pct}% used</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-semibold"><Flame className="w-5 h-5" /> Daily streak</span>
            <b>{attendance.current} days</b>
          </div>
          <Link to="/member/attendance" className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            View attendance <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className={card}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-semibold"><CreditCard className="w-5 h-5" /> Payments</span>
            <PortalPill status={data.balance.status} />
          </div>
          <div className="grid grid-cols-3 text-center">
            <div><p className="text-xs text-muted-foreground">Price</p><b>${data.balance.price}</b></div>
            <div><p className="text-xs text-muted-foreground">Paid</p><b>${data.balance.paid}</b></div>
            <div><p className="text-xs text-muted-foreground">Balance</p><b>${data.balance.balance}</b></div>
          </div>
        </div>

        {messages.length > 0 && (
          <div className={card}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold"><MessageSquare className="w-5 h-5" /> Messages from your gym</span>
              <span className="text-xs text-muted-foreground">{messages.length} total</span>
            </div>
            <div className="space-y-3">
              {messages.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl bg-muted p-3.5">
                  <p className="text-sm leading-6">{item.message}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{item.sentAt ? new Date(item.sentAt).toLocaleString() : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/member/profile" className="flex items-center justify-center gap-2 rounded-xl border border-border p-4 text-sm font-medium hover:bg-accent">
          <CalendarCheck className="w-5 h-5" /> View full profile
        </Link>
      </div>
    </MemberLayout>
  );
}