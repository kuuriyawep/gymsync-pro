import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import PageSkeleton from "@/components/PageSkeleton";
import StatusBadge from "@/components/StatusBadge";
import PaymentsSummary from "@/components/payments/PaymentsSummary";
import PaymentRow from "@/components/payments/PaymentRow";
import EditPaymentModal from "@/components/payments/EditPaymentModal";
import { useToast } from "@/components/ui/use-toast";
import { Banknote, CalendarDays, ChevronDown, DollarSign, Plus, Printer, Receipt, Search, StickyNote, User, Wallet } from "lucide-react";
import { useMembers, useGymAnalytics, useMembersLoaded, useMembersError, recordPayment, updatePayment } from "@/lib/memberStore";
import { useGym } from "@/lib/gymStore";
import { buildRevenueMetrics, money, parseDate, planRate } from "@/lib/gymMetrics";
import { card, ghostBtn, input, label, primaryBtn, textarea } from "@/lib/uiClasses";
import { format, parseISO, isValid, isThisMonth } from "date-fns";

const methodOptions = ["Cash", "Card", "Mobile Money", "Bank Transfer"];
const sortOptions = [
  { key: "recent", label: "Most Recent" },
  { key: "amount", label: "Amount: High to Low" },
  { key: "name", label: "Member A-Z" },
];
const emptyForm = { memberId: "", name: "", plan: "Monthly", amount: "", method: "Cash", date: format(new Date(), "yyyy-MM-dd"), status: "Paid", notes: "" };

const chip = (active) =>
  `flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${active ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-400" : "border-border bg-card text-muted-foreground hover:text-foreground"}`;

export default function Payments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const members = useMembers();
  const analytics = useGymAnalytics();
  const loaded = useMembersLoaded();
  const loadError = useMembersError();
  const gym = useGym();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const { toast } = useToast();

  // Payments mapped to the member they belong to; the status shown is derived
  // from that membership's balance, which is how the gym actually works.
  const payments = useMemo(() => (analytics.payments || []).map((payment) => {
    const member = members.find((item) => item.id === payment.memberId);
    const paidAt = String(payment.paidAt || "");
    const date = paidAt.slice(0, 10);
    const hasTime = /T(?!00:00:00)/.test(paidAt);
    const method = String(payment.method || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    return {
      id: payment.id,
      paymentId: `PAY-${String(payment.id).slice(0, 8).toUpperCase()}`,
      name: payment.memberName,
      plan: member?.plan || "Membership",
      amount: Number(payment.amount || 0),
      method,
      date,
      dateLabel: date && isValid(parseISO(date)) ? format(parseISO(date), "MMM d, yyyy") : "—",
      timeLabel: hasTime ? format(new Date(paidAt), "hh:mm a") : "",
      status: member?.paymentStatus || "Paid",
      reference: payment.reference || "—",
      notes: payment.note || "",
      memberPhone: member?.phone || "",
      memberEmail: member?.email || "",
      membershipId: payment.membershipId || null,
      paidAt,
    };
  }), [analytics.payments, members]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [planFilter, setPlanFilter] = useState("All Plans");
  const [sort, setSort] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const metrics = useMemo(() => buildRevenueMetrics(payments), [payments]);
  const pendingCount = useMemo(() => members.filter((m) => m.paymentStatus === "Pending").length, [members]);
  const overdueCount = useMemo(() => members.filter((m) => m.paymentStatus === "Overdue").length, [members]);
  const planOptions = useMemo(() => [...new Set(members.map((m) => m.plan).filter(Boolean))].sort(), [members]);
  const monthRange = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "MMM d") + " – " + format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "MMM d, yyyy");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = payments.filter((p) => {
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.paymentId.toLowerCase().includes(q) || p.memberPhone.includes(q);
      const matchStatus = statusFilter === "All Status" || p.status === statusFilter;
      const matchPlan = planFilter === "All Plans" || p.plan === planFilter;
      return matchQuery && matchStatus && matchPlan;
    });
    return [...list].sort((a, b) => {
      if (sort === "amount") return b.amount - a.amount;
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.paidAt || b.date) - new Date(a.paidAt || a.date);
    });
  }, [payments, query, statusFilter, planFilter, sort]);

  const selectedMember = members.find((item) => String(item.id) === String(form.memberId)) || null;
  const selectedRate = analytics.plans?.find((plan) => plan.name === selectedMember?.plan);
  const dueAmount = Number(selectedMember?.fee || selectedRate?.price || 0);
  const amountValue = Number(form.amount);

  const openRecord = () => { setForm({ ...emptyForm, date: format(new Date(), "yyyy-MM-dd") }); setFormError(""); setRecordOpen(true); };
  const openRecordForMember = (member) => {
    setForm({ ...emptyForm, memberId: member.id, name: member.name, plan: member.plan || "Monthly", amount: String(member.fee || ""), date: format(new Date(), "yyyy-MM-dd") });
    setFormError("");
    setRecordOpen(true);
  };
  useEffect(() => {
    const memberId = searchParams.get("record");
    if (!memberId || members.length === 0) return;
    const member = members.find((item) => String(item.id) === memberId);
    if (member) openRecordForMember(member);
    setSearchParams({}, { replace: true });
  }, [members, searchParams, setSearchParams]);

  const openDetails = (p) => { setViewing(p); setDetailsOpen(true); };
  const openReceipt = (p) => { setViewing(p); setReceiptOpen(true); setDetailsOpen(false); };
  const openEdit = (p) => { setEditing(p); setEditOpen(true); };
  const submitEdit = async (payload) => {
    setEditSaving(true);
    try {
      await updatePayment(payload);
      setEditOpen(false);
      toast({ title: "Payment updated", description: `$${payload.amount} · ${editing.name}` });
    } catch (error) {
      toast({ title: "Update failed", description: error.message || "Unable to update payment." });
    } finally {
      setEditSaving(false);
    }
  };

  const onMemberSelect = (memberId) => {
    const member = members.find((item) => String(item.id) === memberId);
    setForm((current) => ({ ...current, memberId, name: member?.name || "", plan: member?.plan || "Monthly", amount: member ? String(member.fee) : "" }));
  };
  const submit = async () => {
    const member = members.find((item) => String(item.id) === form.memberId);
    if (!member) { setFormError("Select a member."); return; }
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) { setFormError("Enter an amount greater than zero."); return; }
    if (!form.date || !isValid(parseISO(form.date))) { setFormError("Enter a valid payment date."); return; }
    setFormError("");
    setSaving(true);
    try {
      await recordPayment({ ...form, memberId: member.id, amount: Number(form.amount) });
      setRecordOpen(false);
      toast({ title: "Payment recorded successfully", description: `$${form.amount} · ${form.name}` });
    } catch (error) {
      setFormError(error.message || "Unable to record payment.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <Layout dark><PageSkeleton /></Layout>;

  const selectCls = `${input} flex items-center justify-between gap-2 text-left`;

  return (
    <Layout dark>
      <div className="space-y-4 text-foreground sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Payments</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Track member payments and manage transactions.</p>
          </div>
          <button onClick={openRecord} className={primaryBtn}><Plus className="w-4 h-4" /> Record Payment</button>
        </div>

        {loadError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{loadError}</div>}

        <PaymentsSummary metrics={metrics} pendingCount={pendingCount} overdueCount={overdueCount} rangeLabel={monthRange} />

        {/* Search + filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by member name, phone or ID…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <select className={`${selectCls} sm:w-40`} value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} aria-label="Filter by plan">
            <option>All Plans</option>
            {planOptions.map((plan) => <option key={plan}>{plan}</option>)}
          </select>
          <select className={`${selectCls} sm:w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            {["All Status", "Paid", "Pending", "Overdue"].map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>

        {/* Payment list */}
        <div className={card}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-heading font-semibold">Recent Payments</h2>
              <p className="text-xs text-muted-foreground">{filtered.length} of {payments.length} payments</p>
            </div>
            <div className="relative shrink-0">
              <button onClick={() => setSortOpen((open) => !open)} className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                {sortOptions.find((option) => option.key === sort)?.label} <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl">
                    {sortOptions.map((option) => (
                      <button key={option.key} onClick={() => { setSort(option.key); setSortOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm hover:bg-accent ${sort === option.key ? "font-semibold" : ""}`}>{option.label}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"><Receipt className="w-6 h-6" /></div>
              <p className="font-semibold">No payments found</p>
              <p className="mt-1 text-sm text-muted-foreground">{payments.length === 0 ? "Recorded payments will appear here." : "Try changing your search or filters."}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((payment) => <PaymentRow key={payment.id} payment={payment} onOpen={() => openDetails(payment)} />)}
            </div>
          )}
        </div>
      </div>

      {/* Record Payment */}
      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Record Payment" subtitle="Record a payment for this member." icon={Wallet}
        footer={<>
          <button onClick={() => setRecordOpen(false)} className={ghostBtn}>Cancel</button>
          <button onClick={submit} disabled={saving} className={primaryBtn}><Wallet className="w-4 h-4" /> {saving ? "Recording..." : "Record Payment"}</button>
        </>}>
        <div className="space-y-5">
          {formError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-400">{formError}</p>}

          <div>
            <label className={label}>Member</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
              <select className={`${input} pl-9`} value={form.memberId} onChange={(e) => onMemberSelect(e.target.value)}>
                <option value="">Select a member…</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Membership Plan</label>
            <div className={`${input} flex items-center justify-between`}>
              <span className="truncate">{selectedMember ? selectedMember.plan : "Select a member first"}</span>
              <span className="shrink-0 pl-2 text-xs text-muted-foreground">{selectedMember && dueAmount > 0 ? `${money(dueAmount)} / ${planRate(selectedRate) || "plan"}` : ""}</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className={label}>Amount ($)</label>
              {selectedMember && <span className="text-[11px] text-muted-foreground">Balance {money(Math.max(0, Number(selectedMember.balance || 0)))}</span>}
            </div>
            {dueAmount > 0 && (
              <div className="mb-2 flex gap-2">
                <button type="button" onClick={() => setForm((current) => ({ ...current, amount: String(dueAmount) }))} className={chip(amountValue === dueAmount)}>Full · {money(dueAmount)}</button>
                <button type="button" onClick={() => setForm((current) => ({ ...current, amount: String(Math.round((dueAmount / 2) * 100) / 100) }))} className={chip(amountValue === Math.round((dueAmount / 2) * 100) / 100)}>Partial · {money(Math.round((dueAmount / 2) * 100) / 100)}</button>
              </div>
            )}
            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
              <input type="number" min="0" step="0.01" className={`${input} pl-9 pr-14`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD</span>
            </div>
          </div>

          <div>
            <label className={label}>Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {methodOptions.map((method) => (
                <button key={method} type="button" onClick={() => setForm({ ...form, method })} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${form.method === method ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-400" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
                  <Banknote className="w-4 h-4" /> {method}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Payment Date</label>
              <input type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className={label}>Payment Status</label>
              <div className={`${input} flex items-center`}><StatusBadge status="Paid" /></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={label}>Notes</label>
              <span className="text-[11px] text-muted-foreground">{form.notes.length}/500</span>
            </div>
            <textarea rows={3} maxLength={500} className={textarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-border bg-accent p-3 text-xs text-muted-foreground">
            <StickyNote className="mt-0.5 w-3.5 h-3.5 shrink-0" /> Recording a payment marks it as received and updates the member's balance straight away.
          </p>
        </div>
      </Modal>

      {/* Payment Details */}
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Payment Details" subtitle="Recorded transaction." icon={Receipt}
        footer={<>
          <button onClick={() => setDetailsOpen(false)} className={ghostBtn}>Close</button>
          <button onClick={() => viewing && openReceipt(viewing)} className={primaryBtn}>View receipt</button>
        </>}>
        {viewing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div><p className="text-xs text-muted-foreground">Amount</p><p className="text-2xl font-bold tabular-nums">{money(viewing.amount)}</p></div>
              <StatusBadge status={viewing.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Payment ID", viewing.paymentId], ["Member", viewing.name], ["Plan", viewing.plan],
                ["Method", viewing.method], ["Date", viewing.dateLabel], ["Reference", viewing.reference],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-0.5 truncate text-sm font-medium">{v}</p></div>
              ))}
            </div>
            {viewing.notes && <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Notes</p><p className="mt-0.5 text-sm">{viewing.notes}</p></div>}
          </div>
        )}
      </Modal>

      <EditPaymentModal open={editOpen} onClose={() => setEditOpen(false)} payment={editing} onSave={submitEdit} saving={editSaving} />

      {/* Receipt */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Payment Receipt" subtitle="Share or print this receipt." icon={CalendarDays}
        footer={<>
          <button onClick={() => setReceiptOpen(false)} className={ghostBtn}>Close</button>
          <button onClick={() => window.print()} className={primaryBtn}><Printer className="w-4 h-4" /> Print</button>
        </>}>
        {viewing && (
          <div className="rounded-2xl border border-border p-5">
            <div className="border-b border-dashed border-border pb-4 text-center">
              <p className="text-lg font-bold">{gym.name || "Gym"}</p>
              <p className="text-xs text-muted-foreground">{gym.address || "Not available"}</p>
              <p className="text-xs text-muted-foreground">{gym.phone || "Not available"} · {gym.email || "Not available"}</p>
            </div>
            <div className="space-y-2 border-b border-dashed border-border py-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt No.</span><span className="font-medium tabular-nums">{viewing.paymentId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{viewing.dateLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Member</span><span className="font-medium">{viewing.name}</span></div>
              {viewing.memberPhone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{viewing.memberPhone}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{viewing.plan}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium">{viewing.method}</span></div>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-medium">Total Paid</span>
              <span className="text-2xl font-bold tabular-nums">{money(viewing.amount)}</span>
            </div>
            <div className="border-t border-border pt-3 text-center">
              <StatusBadge status={viewing.status} />
              <p className="mt-3 text-xs text-muted-foreground">Thank you for your payment!</p>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}