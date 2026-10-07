import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { format, parseISO, isValid } from "date-fns";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";
const methodOptions = ["Cash", "Mobile Money", "Card", "Other"];

export default function EditPaymentModal({ open, onClose, payment, onSave, saving }) {
  const [form, setForm] = useState({ amount: "", method: "Cash", date: "", notes: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (payment && open) {
      setForm({
        amount: String(payment.amount ?? ""),
        method: payment.method || "Cash",
        date: payment.date || format(new Date(), "yyyy-MM-dd"),
        notes: payment.notes || ""
      });
      setError("");
    }
  }, [payment, open]);

  const submit = () => {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Enter a payment amount greater than 0."); return; }
    if (!form.date || !isValid(parseISO(form.date))) { setError("Enter a valid payment date."); return; }
    setError("");
    onSave({
      id: payment.id,
      amount,
      method: form.method,
      date: form.date,
      notes: form.notes.trim()
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Payment"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90 disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
      </>}>
      <div className="space-y-4">
        {error && <p role="alert" className="text-sm font-medium text-foreground">{error}</p>}
        {payment && (
          <div className="border border-black/10 rounded-lg p-3 bg-black/[0.02]">
            <p className="text-xs text-black/40">Member</p>
            <p className="text-sm font-medium">{payment.name} · {payment.paymentId}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Amount ($)</label>
            <input type="number" min="0.01" step="0.01" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="60" /></div>
          <div><label className={labelCls}>Payment Method</label>
            <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              {methodOptions.map((o) => <option key={o}>{o}</option>)}
            </select></div>
        </div>
        <div><label className={labelCls}>Payment Date</label>
          <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><label className={labelCls}>Notes</label>
          <textarea rows={2} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" /></div>
      </div>
    </Modal>
  );
}