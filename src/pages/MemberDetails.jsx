import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowLeft, Pencil, RefreshCw, DollarSign, Phone, Mail, CalendarDays, CreditCard, UserCheck, Wallet, MessageSquare } from "lucide-react";
import { useMembers, useGymAnalytics, loadMembers } from "@/lib/memberStore";
import { gymData } from "@/lib/gymDataClient";
import { useToast } from "@/components/ui/use-toast";
import QuickMessageModal from "@/components/QuickMessageModal";
import ProfileImage from "@/components/ProfileImage";
import { differenceInCalendarDays, format, parseISO, isValid } from "date-fns";

const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
const statusBadge = (s) => (s === "Active" ? "bg-black text-white" : s === "Expiring Soon" ? "bg-black/10 text-black" : s === "Expired" ? "bg-black/5 text-black/50" : "bg-black/10 text-black/60");
const payBadge = (s) => (s === "Paid" ? "bg-black text-white" : s === "Pending" ? "bg-black/10 text-black" : "border border-black text-black");

export default function MemberDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quickMsg, setQuickMsg] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const { toast } = useToast();
  const allMembers = useMembers();
  const analytics = useGymAnalytics();
  const member = allMembers.find((m) => String(m.id) === id);
  if (!member) return (
    <Layout>
      <div className="space-y-3">
        <h1 className="text-2xl font-heading font-bold">Member not found</h1>
        <p className="text-sm text-muted-foreground">This member may have been removed or the link is incorrect.</p>
        <button onClick={() => navigate("/members")} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Back to Members</button>
      </div>
    </Layout>
  );
  const startDate = member.startDate || member.registeredDate;
  const expiry = member.expiryDate ? parseISO(member.expiryDate) : null;
  const start = startDate ? parseISO(startDate) : null;
  const registered = member.registeredDate ? parseISO(member.registeredDate) : null;
  const daysRemaining = expiry && isValid(expiry) ? differenceInCalendarDays(expiry, new Date()) : null;
  const fmt = (d) => (d && isValid(d) ? format(d, "MMM d, yyyy") : "—");

  const memberPaymentHistory = (analytics.payments || []).filter((p) => String(p.memberId) === String(member.id)).map((p) => ({ ...p, amount: Number(p.amount || 0), date: String(p.paidAt || "").slice(0, 10), status: "Paid", method: String(p.method || "").replace(/_/g, " "), reference: p.reference || "—" }));
  const memberActivity = memberPaymentHistory.map((p) => ({ id: p.id, type: "Payment recorded", text: `$${p.amount} payment via ${p.method}`, time: p.date }));
  const totalPaid = memberPaymentHistory.reduce((s, p) => s + p.amount, 0);
  const lastPayment = memberPaymentHistory[0] || null;

  const info = [
    { icon: Phone, label: "Phone", value: member.phone },
    { icon: Mail, label: "Email", value: member.email || "—" },
    { icon: CalendarDays, label: "Registration Date", value: fmt(registered) },
    { icon: UserCheck, label: "Status", value: member.status, badge: true },
  ];
  const membership = [
    { label: "Current Plan", value: member.plan },
    { label: "Preferred Time", value: member.preferredTime || "Flexible" },
    { label: "Start Date", value: fmt(start) },
    { label: "Expiry Date", value: fmt(expiry) },
    { label: "Days Remaining", value: daysRemaining != null ? `${daysRemaining} days` : "—" },
    { label: "Payment Status", value: member.paymentStatus, badge: true },
  ];
  const paySummary = [
    { icon: Wallet, label: "Total Paid", value: `$${totalPaid.toLocaleString()}` },
    { icon: DollarSign, label: "Last Payment", value: lastPayment ? `$${lastPayment.amount}` : "—" },
    { icon: CalendarDays, label: "Last Payment Date", value: lastPayment?.date ? format(parseISO(lastPayment.date), "MMM d, yyyy") : "—" },
    { icon: CreditCard, label: "Payment Status", value: member.paymentStatus, badge: true },
  ];

  return (
    <Layout>
      <div className="space-y-5">
        <button onClick={() => navigate("/members")} className="flex items-center gap-1.5 text-sm text-black/60 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Back to Members
        </button>

        {/* Profile header */}
        <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <ProfileImage src={member.photoUrl} alt={member.name} fallback={initials(member.name)} className="w-24 h-24 text-2xl" dark />
            <div className="flex-1">
              <h1 className="text-2xl font-heading font-bold tracking-tight">{member.name}</h1>
              <p className="text-sm text-black/50 mt-0.5">{member.memberId} · {member.gym}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(member.status)}`}>{member.status}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(member.paymentStatus)}`}>{member.paymentStatus}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setQuickMsg(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5"><MessageSquare className="w-4 h-4" /> Quick Message</button>
              <button onClick={() => navigate(`/members?edit=${encodeURIComponent(member.id)}`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5"><Pencil className="w-4 h-4" /> Edit Member</button>
              <button disabled={renewing} onClick={async () => { setRenewing(true); try { await gymData("renewMember", { id: member.id, plan: member.plan, amount: member.fee, durationMonths: 1, paymentStatus: "Paid", paymentMethod: member.paymentMethod || "Cash" }); toast({ title: "Membership renewed", description: `${member.name} is active for another month.` }); await loadMembers(true); } catch (error) { toast({ title: "Renewal failed", description: error.message, variant: "destructive" }); } finally { setRenewing(false); } }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${renewing ? "animate-spin" : ""}`} /> {renewing ? "Renewing…" : "Renew Membership"}</button>
              <button onClick={() => navigate(`/payments?memberId=${encodeURIComponent(member.id)}`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90"><DollarSign className="w-4 h-4" /> Record Payment</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-black/5">
            {info.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center shrink-0"><f.icon className="w-4 h-4" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-black/40">{f.label}</p>
                  {f.badge ? <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(f.value)}`}>{f.value}</span> : <p className="text-sm font-medium truncate">{f.value}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Membership + Payment Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-black/10 rounded-xl p-5">
            <h3 className="font-semibold mb-4">Membership</h3>
            <div className="space-y-0">
              {membership.map((f) => (
                <div key={f.label} className="flex items-center justify-between py-2.5 border-b border-black/5 last:border-0">
                  <span className="text-sm text-black/50">{f.label}</span>
                  {f.badge ? <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(f.value)}`}>{f.value}</span> : <span className="text-sm font-medium">{f.value}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-black/10 rounded-xl p-5">
            <h3 className="font-semibold mb-4">Payment Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {paySummary.map((c) => (
                <div key={c.label} className="border border-black/10 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center mb-2"><c.icon className="w-4 h-4" /></div>
                  {c.badge ? <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(c.value)}`}>{c.value}</span> : <p className="text-lg font-bold">{c.value}</p>}
                  <p className="text-xs text-black/50 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white border border-black/10 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-black/10 text-left text-xs text-black/40">
                <th className="py-2 pr-3 font-medium">Amount</th><th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Method</th><th className="py-2 pr-3 font-medium">Status</th><th className="py-2 font-medium">Reference</th>
              </tr></thead>
              <tbody>
                {memberPaymentHistory.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0">
                    <td className="py-2.5 pr-3 font-medium tabular-nums">${p.amount}</td>
                    <td className="py-2.5 pr-3 text-black/70">{format(parseISO(p.date), "MMM d, yyyy")}</td>
                    <td className="py-2.5 pr-3 text-black/70">{p.method}</td>
                    <td className="py-2.5 pr-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(p.status)}`}>{p.status}</span></td>
                    <td className="py-2.5 text-black/50 tabular-nums">{p.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Internal note */}
        <div className="bg-white border border-black/10 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Internal Note</h3>
          {member.note ? <p className="text-sm text-black/70 whitespace-pre-wrap">{member.note}</p> : <p className="text-sm text-black/40">No note added. Edit the member to add a private note.</p>}
        </div>

        {/* Activity */}
        <div className="bg-white border border-black/10 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-0">
            {memberActivity.map((a, i) => (
              <div key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4" /></div>
                  {i < memberActivity.length - 1 && <div className="w-px flex-1 bg-black/10 my-1" />}
                </div>
                <div className="pb-5">
                  <p className="text-sm font-medium">{a.type}</p>
                  <p className="text-xs text-black/50">{a.text}</p>
                  <p className="text-xs text-black/40 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <QuickMessageModal open={quickMsg} onClose={() => setQuickMsg(false)} member={member} />
    </Layout>
  );
}