import React, { useState } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import { Plus, Users, Calendar, Check } from "lucide-react";
import { plans as mockPlans } from "@/lib/mockData";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

export default function Membership() {
  const [plans, setPlans] = useState(mockPlans);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration: "", activeMembers: "" });

  const submit = () => {
    if (!form.name.trim()) return;
    const id = Math.max(...plans.map((p) => p.id), 0) + 1;
    setPlans((ps) => [...ps, { id, name: form.name, price: Number(form.price) || null, duration: form.duration || "Custom", activeMembers: Number(form.activeMembers) || 0, status: "Active" }]);
    setModalOpen(false);
    setForm({ name: "", price: "", duration: "", activeMembers: "" });
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Membership Management</h1>
            <p className="text-sm text-black/50 mt-0.5">Create and manage your membership plans</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-white border border-black/10 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-black text-white"><Check className="w-3 h-3" /> {p.status}</span>
              </div>
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-3xl font-bold mt-1">
                {p.price == null ? "Custom" : `$${p.price}`}
                {p.price != null && <span className="text-xs font-normal text-black/40"> / plan</span>}
              </p>
              <div className="flex items-center gap-2 text-xs text-black/50 mt-2"><Calendar className="w-3.5 h-3.5" /> {p.duration}</div>
              <div className="flex items-center gap-2 text-xs text-black/50 mt-1"><Users className="w-3.5 h-3.5" /> {p.activeMembers} active members</div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Plan"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Add plan</button>
        </>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Plan Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1.5">Price ($)</label>
              <input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="60" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Duration</label>
              <input className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="1 month" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1.5">Active Members</label>
            <input type="number" className={inputCls} value={form.activeMembers} onChange={(e) => setForm({ ...form, activeMembers: e.target.value })} placeholder="0" /></div>
        </div>
      </Modal>
    </Layout>
  );
}