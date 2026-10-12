import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { AlertCircle, ArrowLeft, BellRing, CalendarDays, Clock, CreditCard, DollarSign, KeyRound, Mail, MessageSquare, Pencil, Phone, RefreshCw, User, UserCheck, Wallet } from "lucide-react";
import { useGymAnalytics, useMembers } from "@/lib/memberStore";
import { useMemberDetails } from "@/hooks/useMemberDetails";
import QuickMessageModal from "@/components/QuickMessageModal";
import ProfileImage from "@/components/ProfileImage";
import StatusBadge from "@/components/StatusBadge";
import { money, planRate } from "@/lib/gymMetrics";
import { card, ghostBtn, pill, primaryBtn, sectionLabel } from "@/lib/uiClasses";
import { differenceInCalendarDays, format, parseISO, isValid } from "date-fns";

const initials = (name) => String(name || "").split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
const activityIcon = (type) => (type === "Payment" ? CreditCard : type === "Check-in" ? Clock : type === "update" ? RefreshCw : UserCheck);

const Row = ({ label, value, badge }) => (
  <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    {badge ? <StatusBadge status={value} /> : <span className="text-right text-sm font-medium">{value}</span>}
  </div>
);

export default function MemberDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quickMsg, setQuickMsg] = useState(false);
  const [tab, setTab] = useState("overview");
  const allMembers = useMembers();
  const analytics = useGymAnalytics();
  const member = allMembers.find((m) => String(m.id) === id);
  const { details, loading, error } = useMemberDetails(id);

  if (!member) return (
    <Layout dark>
      <div className="space-y-3 text-foreground">
        <h1 className="font-heading text-2xl font-bold">Member not found</h1>
        <p className="text-sm text-muted-foreground">This member may have been removed or the link is incorrect.</p>
        <button onClick={() => navigate("/members")} className={`${primaryBtn} mt-1`}>Back to Members</button>
      </div>
    </Layout>
  );

  const startDate = member.startDate || member.registeredDate;
  const expiry = member.expiryDate ? parseISO(member.expiryDate) : null;
  const start = startDate ? parseISO(startDate) : null;
  const registered = member.registeredDate ? parseISO(member.registeredDate) : null;
  const daysRemaining = expiry && isValid(expiry) ? differenceInCalendarDays(expiry, new Date()) : null;
  const fmt = (d) => (d && isValid(d) ? format(d, "MMM d, yyyy") : "—");

  const canViewPayments = details?.canViewPayments === true;
  const canRecordPayments = details?.canRecordPayments === true;
  const payments = canViewPayments ? (details?.payments || []) : [];
  const activities = details?.activities || [];
  const checkIns = activities.filter((a) => a.type === "Check-in");
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const lastPayment = payments[0] || null;
  const outstandingBalance = details?.balance ?? 0;
  const planInfo = (analytics.plans || []).find((plan) => plan.name === member.plan) || null;
  const rate = planRate(planInfo);
  const renewSoon = daysRemaining !== null && daysRemaining <= 7;

  const info = [
    { icon: Phone, label: "Phone", value: member.phone },
    { icon: Mail, label: "Email", value: member.email || "—" },
    { icon: User, label: "Gender", value: member.gender || "—" },
  ];
  const membershipRows = [
    { label: "Membership Plan", value: member.plan, badge: true },
    { label: "Start Date", value: fmt(start) },
    { label: "Expiry Date", value: fmt(expiry) },
    { label: "Days Remaining", value: daysRemaining != null ? `${daysRemaining} days` : "—" },
    { label: "Preferred Time", value: member.preferredTime || "Flexible" },
    { label: "Join Code", value: member.joinToken || "—" },
    { label: "Status", value: member.status, badge: true },
  ];
  const personalRows = [
    { label: "Full Name", value: member.name },
    { label: "Phone Number", value: member.phone },
    { label: "Email", value: member.email || "—" },
    { label: "Gender", value: member.gender || "—" },
    { label: "Member ID", value: member.memberId },
    { label: "Join Date", value: fmt(registered) },
  ];
  const paySummary = [
    { icon: Wallet, label: "Total Paid", value: money(totalPaid) },
    { icon: DollarSign, label: "Last Payment", value: lastPayment ? money(lastPayment.amount) : "—" },
    { icon: CalendarDays, label: "Last Payment Date", value: lastPayment?.date ? format(parseISO(lastPayment.date), "MMM d, yyyy") : "—" },
    { icon: AlertCircle, label: "Outstanding Balance", value: money(outstandingBalance), danger: outstandingBalance > 0 },
  ];
  const tabs = [
    { key: "overview", label: "Overview" },
    ...(canViewPayments ? [{ key: "payments", label: "Payments" }] : []),
    { key: "attendance", label: "Attendance" },
    { key: "notes", label: "Notes" },
    { key: "activity", label: "Activity" },
  ];
  const activityList = (items) => (
    <div className="space-y-0">
      {items.map((a, i) => {
        const Icon = activityIcon(a.type);
        return (
          <div key={a.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"><Icon className="w-4 h-4" /></span>
              {i < items.length - 1 && <div className="my-1 w-px flex-1 bg-border" />}
            </div>
            <div className="pb-5">
              <p className="text-sm font-medium">{a.type === "Check-in" ? "Attendance check-in" : a.type}</p>
              <p className="text-xs text-muted-foreground">{a.text}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Layout dark>
      <div className="space-y-4 text-foreground sm:space-y-5">
        <button onClick={() => navigate("/members")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Members
        </button>

        {/* Profile header */}
        <div className={`${card} p-4 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ProfileImage src={member.photoUrl} alt={member.name} fallback={initials(member.name)} className="w-20 h-20 text-xl sm:w-24 sm:h-24 sm:text-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold tracking-tight">{member.name}</h1>
                <StatusBadge status={member.status} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{member.memberId} · Member since {fmt(registered)}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {info.map((field) => (
                  <span key={field.label} className="flex items-center gap-1.5 text-xs text-muted-foreground"><field.icon className="w-3.5 h-3.5 shrink-0" /> {field.value}</span>
                ))}
              </div>
            </div>
            <div className="shrink-0 rounded-2xl border border-border p-3 sm:w-44">
              <p className="text-[11px] text-muted-foreground">Current Plan</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold"><CreditCard className="w-4 h-4 text-emerald-400" /> {member.plan}</p>
              <p className="text-xs text-muted-foreground">{member.fee > 0 ? `${money(member.fee)}${rate ? ` / ${rate}` : ""}` : "No price set"}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <button onClick={() => navigate(`/members?renew=${encodeURIComponent(member.id)}`)} className={primaryBtn}><RefreshCw className="w-4 h-4" /> Renew Membership</button>
            {canRecordPayments && <button onClick={() => navigate(`/payments?record=${encodeURIComponent(member.id)}`)} className={ghostBtn}><DollarSign className="w-4 h-4" /> Record Payment</button>}
            <button onClick={() => navigate(`/members?edit=${encodeURIComponent(member.id)}`)} className={ghostBtn}><Pencil className="w-4 h-4" /> Edit Member</button>
            <button onClick={() => setQuickMsg(true)} className={ghostBtn}><MessageSquare className="w-4 h-4" /> Quick Message</button>
          </div>
        </div>

        <div className="-mb-1 flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} aria-pressed={tab === item.key} className={pill(tab === item.key)}>{item.label}</button>)}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={`${card} p-4 sm:p-5`}>
              <h2 className={`${sectionLabel} mb-2`}>Membership Information</h2>
              {membershipRows.map((row) => <Row key={row.label} {...row} />)}
            </div>
            <div className={`${card} p-4 sm:p-5`}>
              <h2 className={`${sectionLabel} mb-2`}>Personal Information</h2>
              {personalRows.map((row) => <Row key={row.label} {...row} />)}
            </div>
            <div className={`${card} p-4 sm:p-5 lg:col-span-2`}>
              <h2 className={`${sectionLabel} mb-3`}>Recent Activity</h2>
              {loading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading activity…</p> : activities.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No recent activity.</p> : activityList(activities.slice(0, 4))}
            </div>
            {renewSoon && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 sm:col-span-2">
                <div className="flex items-start gap-3">
                  <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-400">Membership Renewal</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {daysRemaining < 0
                        ? `This membership expired on ${fmt(expiry)}. Renew now to restore access.`
                        : `This membership ${daysRemaining === 0 ? "expires today" : `will expire in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`}. Renew now to avoid interruption.`}
                    </p>
                  </div>
                  <button onClick={() => navigate(`/members?renew=${encodeURIComponent(member.id)}`)} className={`${ghostBtn} !border-emerald-400/40 !text-emerald-400`}>Renew Now</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {paySummary.map((item) => (
                <div key={item.label} className={`${card} p-4`}>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.danger ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}><item.icon className="w-4 h-4" /></span>
                  <p className={`mt-2 text-lg font-bold tabular-nums ${item.danger ? "text-red-400" : ""}`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <div className={`${card} p-4 sm:p-5`}>
              <h2 className={`${sectionLabel} mb-2`}>Payment History</h2>
              {loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading payment history…</p>
              ) : error ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{error}</p>
              ) : payments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead><tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Amount</th><th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Method</th><th className="py-2 pr-3 font-medium">Status</th><th className="py-2 font-medium">Reference</th>
                    </tr></thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="py-2.5 pr-3 font-medium tabular-nums">{money(p.amount)}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground">{fmt(parseISO(p.date))}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground">{p.method}</td>
                          <td className="py-2.5 pr-3"><StatusBadge status={p.status} /></td>
                          <td className="py-2.5 tabular-nums text-muted-foreground">{p.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "attendance" && (
          <div className={`${card} p-4 sm:p-5`}>
            <h2 className={`${sectionLabel} mb-3`}>Gym Check-ins</h2>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading check-ins…</p>
            ) : checkIns.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No check-ins recorded for this member yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {checkIns.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex items-center gap-3 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"><Clock className="w-4 h-4" /></span> Checked in at the gym</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{entry.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className={`${card} p-4 sm:p-5`}>
            <h2 className={`${sectionLabel} mb-3`}>Internal Note</h2>
            {member.note ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{member.note}</p> : <p className="text-sm text-muted-foreground">No note added. Edit the member to add a private note.</p>}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <button onClick={() => navigate(`/members?edit=${encodeURIComponent(member.id)}`)} className={ghostBtn}><Pencil className="w-4 h-4" /> Edit note</button>
              <button onClick={() => setQuickMsg(true)} className={ghostBtn}><MessageSquare className="w-4 h-4" /> Quick Message</button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><KeyRound className="w-3.5 h-3.5" /> Join code: {member.joinToken || "—"}</p>
          </div>
        )}

        {tab === "activity" && (
          <div className={`${card} p-4 sm:p-5`}>
            <h2 className={`${sectionLabel} mb-3`}>Full Activity</h2>
            {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading activity…</p> : activities.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded yet.</p> : activityList(activities)}
          </div>
        )}
      </div>

      <QuickMessageModal open={quickMsg} onClose={() => setQuickMsg(false)} member={member} />
    </Layout>
  );
}