import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { Wallet } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ghostBtn, input, label, primaryBtn, textarea } from "@/lib/uiClasses";

const methodOptions = ["Cash", "Card", "Mobile Money", "Bank Transfer"];

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
    <Modal open={open} onClose={onClose} title="Edit Payment" subtitle="Update this payment record." icon={Wallet}
      footer={<>
        <button onClick={onClose} className={ghostBtn}>Cancel</button>
        <button onClick={submit} disabled={saving} className={primaryBtn}>{saving ? "Saving..." : "Save Changes"}</button>
      </>}>
      <div className="space-y-4">
        {error && <p role="alert" className="text-sm font-medium text-red-400">{error}</p>}
        {payment && (
          <div className={`${input} flex items-center justify-between`}>
            <span className="text-xs text-muted-foreground">Member</span>
            <span className="truncate pl-3 font-medium">{payment.name} · {payment.paymentId}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Amount ($)</label>
            <input type="number" min="0.01" step="0.01" className={input} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="60" /></div>
          <div><label className={label}>Payment Method</label>
            <select className={input} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              {methodOptions.map((o) => <option key={o}>{o}</option>)}
            </select></div>
        </div>
        <div><label className={label}>Payment Date</label>
          <input type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><label className={label}>Notes</label>
          <textarea rows={2} className={textarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" /></div>
      </div>
    </Modal>
  );
}