import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import { Plus, DollarSign, CalendarDays, Clock, AlertCircle } from "lucide-react";
import { payments as mockPayments } from "@/lib/mockData";
import { format, parseISO, isToday, isThisWeek, isThisMonth } from "date-fns";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const statusFilters = ["All", "Paid", "Pending", "Overdue"];
const dateFilters = ["Today", "This Week", "This Month", "Custom Range"];
const payBadge = (s) => (s === "Paid" ? "bg-black text-white" : s === "Pending" ? "bg-black/10 text-black" : "border border-black text-black");

export default function Payments() {
  const [payments, setPayments] = useState(mockPayments);
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("This Month");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", plan: "Monthly", amount: "", method: "Cash", date: format(new Date(), "yyyy-MM-dd"), reference: "" });

  const summary = useMemo(() => {
    const today = payments.filter((p) => isToday(parseISO(p.date)) && p.status === "Paid").reduce((s, p) => s + p.amount, 0);
    const month = payments.filter((p) => isThisMonth(parseISO(p.date)) && p.status === "Paid").reduce((s, p) => s + p.amount, 0);
    const pending = payments.filter((p) => p.status === "Pending").length;
    const overdue = payments.filter((p) => p.status === "Overdue").length;
    return { today, month, pending, overdue };
  }, [payments]);

  const filtered = useMemo(() => payments.filter((p) => {
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const d = parseISO(p.date);
    let matchDate = true;
    if (dateFilter === "Today") matchDate = isToday(d);
    else if (dateFilter === "This Week") matchDate = isThisWeek(d, { weekStartsOn: 1 });
    else if (dateFilter === "This Month") matchDate = isThisMonth(d);
    return matchStatus && matchDate;
  }), [payments, statusFilter, dateFilter]);

  const submit = () => {
    if (!form.name.trim() || !form.amount) return;
    const id = Math.max(...payments.map((p) => p.id), 0) + 1;
    setPayments((ps) => [{ id, name: form.name, plan: form.plan, amount: Number(form.amount) || 0, date: form.date, method: form.method, status: "Paid", reference: form.reference || `TXN-${2000 + id}` }, ...ps]);
    setModalOpen(false);
    setForm({ name: "", plan: "Monthly", amount: "", method: "Cash", date: format(new Date(), "yyyy-MM-dd"), reference: "" });
  };

  const summaryCards = [
    { label: "Today's Revenue", value: `$${summary.today}`, icon: DollarSign },
    { label: "This Month", value: `$${summary.month}`, icon: CalendarDays },
    { label: "Pending Payments", value: summary.pending, icon: Clock },
    { label: "Overdue Payments", value: summary.overdue, icon: AlertCircle },
  ];

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Payments</h1>
            <p className="text-sm text-black/50 mt-0.5">Track and record member payments</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((s) => (
            <div key={s.label} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center"><s.icon className="w-4 h-4" /></div></div>
              <p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-black/50">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusFilters.map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === f ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap sm:ml-auto">
            {dateFilters.map((f) => (
              <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${dateFilter === f ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white border border-black/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/10 text-left text-xs text-black/40">
              <th className="px-5 py-3 font-medium">Member</th><th className="px-5 py-3 font-medium">Plan</th><th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Method</th><th className="px-5 py-3 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-black/40">No payments found.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-black/70">{p.plan}</td>
                  <td className="px-5 py-3 tabular-nums font-medium">${p.amount}</td>
                  <td className="px-5 py-3 text-black/70">{format(parseISO(p.date), "MMM d, yyyy")}</td>
                  <td className="px-5 py-3 text-black/70">{p.method}</td>
                  <td className="px-5 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(p.status)}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white border border-black/10 rounded-xl p-8 text-center text-sm text-black/40">No payments found.</div>
          ) : filtered.map((p) => (
            <div key={p.id} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">{p.name}</p><p className="text-xs text-black/50">{p.plan} · {p.method}</p></div>
                <p className="font-bold tabular-nums">${p.amount}</p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 text-xs">
                <span className="text-black/50">{format(parseISO(p.date), "MMM d, yyyy")}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(p.status)}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Record</button>
        </>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Member Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1.5">Plan</label>
              <select className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option>Monthly</option><option>3 Months</option><option>6 Months</option><option>Custom</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1.5">Amount ($)</label>
              <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="60" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1.5">Method</label>
              <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option>Cash</option><option>Mobile Money</option><option>Card</option><option>Other</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1.5">Date</label>
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1.5">Reference</label>
            <input className={inputCls} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="TXN-XXXX" /></div>
        </div>
      </Modal>
    </Layout>
  );
}