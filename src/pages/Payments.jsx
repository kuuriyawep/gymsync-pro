import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/EmptyState";
import PageSkeleton from "@/components/PageSkeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Eye, Pencil, DollarSign, CalendarDays, Clock, AlertCircle, CreditCard, Printer, ChevronDown } from "lucide-react";
import { useMembers, useGymAnalytics, useMembersLoaded, useMembersError, recordPayment, updatePayment } from "@/lib/memberStore";
import { useGym } from "@/lib/gymStore";
import EditPaymentModal from "@/components/payments/EditPaymentModal";
import { format, parseISO, isValid, isToday, isThisWeek, isThisMonth } from "date-fns";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";
const statusFilters = ["All", "Paid", "Pending", "Overdue", "Refunded"];
const methodFilters = ["All", "Cash", "Mobile Money", "Card", "Other"];
const dateFilters = ["All Time", "Today", "This Week", "This Month"];
const sortOptions = [
  { key: "recent", label: "Most Recent" },
  { key: "amount", label: "Amount: High to Low" },
  { key: "name", label: "Member A-Z" },
];
const payOptions = ["Paid"];
const methodOptions = ["Cash", "Mobile Money", "Card", "Other"];

const payBadge = (s) => {
  if (s === "Paid") return "bg-emerald-600 text-white";
  if (s === "Pending") return "bg-black/10 text-black";
  if (s === "Overdue") return "border border-black text-black";
  return "bg-black/5 text-black/50 line-through";
};
const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
const emptyForm = { memberId: "", name: "", plan: "Monthly", amount: "", method: "Cash", date: format(new Date(), "yyyy-MM-dd"), status: "Paid", notes: "" };

export default function Payments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const members = useMembers();
  const analytics = useGymAnalytics();
  const loaded = useMembersLoaded();
  const loadError = useMembersError();
  const gym = useGym();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const payments = useMemo(() => (analytics.payments || []).map((payment) => {
    const member = members.find((item) => item.id === payment.memberId);
    const method = String(payment.method || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    return { id: payment.id, paymentId: `PAY-${String(payment.id).slice(0, 8).toUpperCase()}`, name: payment.memberName, plan: member?.plan || "Membership", amount: Number(payment.amount || 0), method, date: String(payment.paidAt).slice(0, 10), status: member?.paymentStatus || "Paid", reference: payment.reference || "—", notes: payment.note || "", memberPhone: member?.phone || "", memberEmail: member?.email || "" };
  }), [analytics.payments, members]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");
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
  const { toast } = useToast();

  const summary = useMemo(() => {
    const total = payments.reduce((s, p) => s + p.amount, 0);
    const month = payments.filter((p) => isThisMonth(parseISO(p.date))).reduce((s, p) => s + p.amount, 0);
    const pending = members.filter((m) => m.paymentStatus === "Pending").length;
    const overdue = members.filter((m) => m.paymentStatus === "Overdue").length;
    return { total, month, pending, overdue };
  }, [payments, members]);

  const filtered = useMemo(() => {
    let list = payments.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.paymentId.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchMethod = methodFilter === "All" || p.method === methodFilter;
      const d = parseISO(p.date);
      let matchDate = true;
      if (dateFilter === "Today") matchDate = isToday(d);
      else if (dateFilter === "This Week") matchDate = isThisWeek(d, { weekStartsOn: 1 });
      else if (dateFilter === "This Month") matchDate = isThisMonth(d);
      return matchQuery && matchStatus && matchMethod && matchDate;
    });
    list = [...list].sort((a, b) => {
      if (sort === "amount") return b.amount - a.amount;
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.date) - new Date(a.date);
    });
    return list;
  }, [payments, query, statusFilter, methodFilter, dateFilter, sort]);

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

  const summaryCards = [
    { label: "Total Revenue", value: `$${summary.total.toLocaleString()}`, icon: DollarSign },
    { label: "This Month", value: `$${summary.month.toLocaleString()}`, icon: CalendarDays },
    { label: "Pending Payments", value: summary.pending, icon: Clock },
    { label: "Overdue Payments", value: summary.overdue, icon: AlertCircle },
  ];

  if (!loaded) return <Layout><PageSkeleton /></Layout>;

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Payments</h1>
            <p className="text-sm text-black/50 mt-0.5">Track membership payments and gym revenue</p>
          </div>
          <button onClick={openRecord} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>

        {loadError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{loadError}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((s) => (
            <div key={s.label} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center"><s.icon className="w-4 h-4" /></div></div>
              <p className="text-xl md:text-2xl font-bold">{s.value}</p><p className="text-xs text-black/50">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/5">
          <Search className="w-4 h-4 text-black/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by member or payment ID…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusFilters.map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === f ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {methodFilters.map((f) => (
              <button key={f} onClick={() => setMethodFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${methodFilter === f ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{f}</button>
            ))}
            <div className="flex items-center gap-1.5 flex-wrap sm:ml-auto">
              {dateFilters.map((f) => (
                <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${dateFilter === f ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{f}</button>
              ))}
            </div>
            <div className="relative">
              <button onClick={() => setSortOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-xs font-medium hover:bg-black/5">
                Sort: {sortOptions.find((o) => o.key === sort)?.label} <ChevronDown className="w-3.5 h-3.5 text-black/50" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 bg-white border border-black/10 rounded-lg shadow-lg w-48 py-1">
                    {sortOptions.map((o) => (
                      <button key={o.key} onClick={() => { setSort(o.key); setSortOpen(false); }} className={`flex items-center w-full px-3 py-2 text-sm hover:bg-black/5 text-left ${sort === o.key ? "font-semibold" : ""}`}>{o.label}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments found" description="Try changing your search or filters." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white border border-black/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-black/10 text-left text-xs text-black/40">
                  <th className="px-5 py-3 font-medium">Member</th><th className="px-5 py-3 font-medium">Payment ID</th><th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Plan</th><th className="px-5 py-3 font-medium">Method</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                      <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-semibold">{initials(p.name)}</div><span className="font-medium">{p.name}</span></div></td>
                      <td className="px-5 py-3 text-black/70 tabular-nums">{p.paymentId}</td>
                      <td className="px-5 py-3 tabular-nums font-medium">${p.amount}</td>
                      <td className="px-5 py-3 text-black/70">{p.plan}</td>
                      <td className="px-5 py-3 text-black/70">{p.method}</td>
                      <td className="px-5 py-3 text-black/70">{format(parseISO(p.date), "MMM d, yyyy")}</td>
                      <td className="px-5 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(p.status)}`}>{p.status}</span></td>
                      <td className="px-5 py-3"><div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetails(p)} className="p-1.5 rounded-lg hover:bg-black/5" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-black/5" title="Edit"><Pencil className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="bg-white border border-black/10 rounded-xl p-4" onClick={() => openDetails(p)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-semibold">{initials(p.name)}</div><div><p className="font-medium">{p.name}</p><p className="text-xs text-black/50">{p.paymentId} · {p.method}</p></div></div>
                    <p className="font-bold tabular-nums">${p.amount}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 text-xs">
                    <span className="text-black/50">{p.plan} · {format(parseISO(p.date), "MMM d, yyyy")}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(p.status)}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Record Payment */}
      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Record Payment"
        footer={<>
          <button onClick={() => setRecordOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90 disabled:opacity-60">{saving ? "Recording..." : "Record Payment"}</button>
        </>}>
        <div className="space-y-4">
          {formError && <p role="alert" className="text-sm font-medium text-foreground">{formError}</p>}
          <div><label className={labelCls}>Member</label>
            <select className={inputCls} value={form.memberId} onChange={(e) => onMemberSelect(e.target.value)}>
              <option value="">Select a member…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Membership Plan</label>
              <select className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                {["Monthly", "3 Months", "6 Months", "Custom"].map((o) => <option key={o}>{o}</option>)}
              </select></div>
            <div><label className={labelCls}>Amount ($)</label>
              <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="60" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Payment Method</label>
              <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {methodOptions.map((o) => <option key={o}>{o}</option>)}
              </select></div>
            <div><label className={labelCls}>Payment Date</label>
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div><label className={labelCls}>Payment Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {payOptions.map((o) => <option key={o}>{o}</option>)}
            </select></div>
          <div><label className={labelCls}>Notes</label>
            <textarea rows={2} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" /></div>
        </div>
      </Modal>

      {/* Payment Details */}
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Payment Details"
        footer={<>
          <button onClick={() => setDetailsOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Close</button>
          <button onClick={() => viewing && openReceipt(viewing)} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">View receipt</button>
        </>}>
        {viewing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-black/10 rounded-xl">
              <div><p className="text-xs text-black/40">Amount</p><p className="text-2xl font-bold">${viewing.amount}</p></div>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${payBadge(viewing.status)}`}>{viewing.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Payment ID", viewing.paymentId], ["Member", viewing.name], ["Plan", viewing.plan],
                ["Method", viewing.method], ["Date", format(parseISO(viewing.date), "MMM d, yyyy")], ["Reference", viewing.reference],
              ].map(([l, v]) => (
                <div key={l} className="border border-black/10 rounded-lg p-3"><p className="text-xs text-black/40">{l}</p><p className="text-sm font-medium mt-0.5">{v}</p></div>
              ))}
            </div>
            {viewing.notes && <div className="border border-black/10 rounded-lg p-3"><p className="text-xs text-black/40">Notes</p><p className="text-sm mt-0.5">{viewing.notes}</p></div>}
          </div>
        )}
      </Modal>

      {/* Edit Payment */}
      <EditPaymentModal open={editOpen} onClose={() => setEditOpen(false)} payment={editing} onSave={submitEdit} saving={editSaving} />

      {/* Receipt */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Payment Receipt"
        footer={<>
          <button onClick={() => setReceiptOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Close</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90"><Printer className="w-4 h-4" /> Print</button>
        </>}>
        {viewing && (
          <div className="border border-black/15 rounded-xl p-5">
            <div className="text-center pb-4 border-b border-dashed border-black/15">
              <p className="text-lg font-bold">{gym.name || "Gym"}</p>
              <p className="text-xs text-black/50">{gym.address || "Not available"}</p>
              <p className="text-xs text-black/50">{gym.phone || "Not available"} · {gym.email || "Not available"}</p>
            </div>
            <div className="py-4 border-b border-dashed border-black/15 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-black/50">Receipt No.</span><span className="font-medium tabular-nums">{viewing.paymentId}</span></div>
              <div className="flex justify-between"><span className="text-black/50">Date</span><span className="font-medium">{format(parseISO(viewing.date), "MMM d, yyyy")}</span></div>
              <div className="flex justify-between"><span className="text-black/50">Member</span><span className="font-medium">{viewing.name}</span></div>
              {viewing.memberPhone && <div className="flex justify-between"><span className="text-black/50">Phone</span><span className="font-medium">{viewing.memberPhone}</span></div>}
              {viewing.memberEmail && <div className="flex justify-between"><span className="text-black/50">Email</span><span className="font-medium">{viewing.memberEmail}</span></div>}
              <div className="flex justify-between"><span className="text-black/50">Plan</span><span className="font-medium">{viewing.plan}</span></div>
              <div className="flex justify-between"><span className="text-black/50">Method</span><span className="font-medium">{viewing.method}</span></div>
            </div>
            <div className="py-4 flex justify-between items-center">
              <span className="text-sm font-medium">Total Paid</span>
              <span className="text-2xl font-bold">${viewing.amount}</span>
            </div>
            <div className="pt-3 border-t border-black/15 text-center">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${payBadge(viewing.status)}`}>{viewing.status}</span>
              <p className="text-xs text-black/40 mt-3">Thank you for your payment!</p>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}