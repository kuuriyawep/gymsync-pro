import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import { Plus, Pencil, Eye, Users, UserCheck, UserCog, Phone, Activity } from "lucide-react";
import { trainers as mockTrainers } from "@/lib/mockData";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
const statusBadge = (s) => (s === "Active" ? "bg-black text-white" : "bg-black/10 text-black/50");

export default function Trainers() {
  const [trainers, setTrainers] = useState(mockTrainers);
  const [formModal, setFormModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", specialization: "", status: "Active" });

  const summary = useMemo(() => ({
    total: trainers.length,
    active: trainers.filter((t) => t.status === "Active").length,
    assigned: trainers.reduce((s, t) => s + t.assigned, 0),
  }), [trainers]);

  const openAdd = () => { setEditingId(null); setForm({ name: "", phone: "", specialization: "", status: "Active" }); setFormModal(true); };
  const openEdit = (t) => { setEditingId(t.id); setForm({ name: t.name, phone: t.phone, specialization: t.specialization, status: t.status }); setFormModal(true); };
  const openView = (t) => { setViewing(t); setDetailsModal(true); };
  const submit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      setTrainers((ts) => ts.map((t) => (t.id === editingId ? { ...t, ...form } : t)));
    } else {
      const id = Math.max(...trainers.map((t) => t.id), 0) + 1;
      setTrainers((ts) => [{ id, ...form, assigned: 0, assignedMembers: [], activity: [] }, ...ts]);
    }
    setFormModal(false);
  };

  const summaryCards = [
    { label: "Total Trainers", value: summary.total, icon: UserCog },
    { label: "Active Trainers", value: summary.active, icon: UserCheck },
    { label: "Members Assigned", value: summary.assigned, icon: Users },
  ];

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Trainers</h1>
            <p className="text-sm text-black/50 mt-0.5">Manage your gym's trainers and their assignments</p>
          </div>
          <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4" /> Add Trainer
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {summaryCards.map((s) => (
            <div key={s.label} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center"><s.icon className="w-4 h-4" /></div></div>
              <p className="text-xl md:text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-black/50">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map((t) => (
            <div key={t.id} className="bg-white border border-black/10 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">{initials(t.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  <p className="text-xs text-black/50 truncate">{t.specialization}</p>
                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(t.status)}`}>{t.status}</span>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-black/60"><Phone className="w-3.5 h-3.5" /> {t.phone}</div>
                <div className="flex items-center gap-2 text-black/60"><Users className="w-3.5 h-3.5" /> {t.assigned} members assigned</div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5">
                <button onClick={() => openView(t)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-black/15 hover:bg-black/5"><Eye className="w-3.5 h-3.5" /> View</button>
                <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-black/15 hover:bg-black/5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal open={formModal} onClose={() => setFormModal(false)} title={editingId ? "Edit Trainer" : "Add Trainer"}
        footer={<>
          <button onClick={() => setFormModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">{editingId ? "Save" : "Add trainer"}</button>
        </>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jake Miller" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Phone</label>
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0200" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Specialization</label>
            <input className={inputCls} value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Strength Training" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Active</option><option>Inactive</option>
            </select></div>
        </div>
      </Modal>

      {/* Details modal */}
      <Modal open={detailsModal} onClose={() => setDetailsModal(false)} title="Trainer Details"
        footer={<>
          <button onClick={() => setDetailsModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Close</button>
          <button onClick={() => { if (viewing) openEdit(viewing); setDetailsModal(false); }} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Edit Trainer</button>
        </>}>
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold">{initials(viewing.name)}</div>
              <div>
                <p className="text-lg font-semibold">{viewing.name}</p>
                <p className="text-sm text-black/50">{viewing.specialization}</p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(viewing.status)}`}>{viewing.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="border border-black/10 rounded-lg p-3"><p className="text-xs text-black/40">Phone</p><p className="font-medium mt-0.5">{viewing.phone}</p></div>
              <div className="border border-black/10 rounded-lg p-3"><p className="text-xs text-black/40">Members Assigned</p><p className="font-medium mt-0.5">{viewing.assigned}</p></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Assigned Members</h4>
              <div className="space-y-2">
                {viewing.assignedMembers.length === 0 ? <p className="text-xs text-black/40">No members assigned.</p> :
                  viewing.assignedMembers.map((m) => (
                    <div key={m} className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-semibold">{initials(m)}</div>
                      {m}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4" /> Recent Activity</h4>
              <div className="space-y-2">
                {viewing.activity.length === 0 ? <p className="text-xs text-black/40">No recent activity.</p> :
                  viewing.activity.map((a) => (
                    <div key={a.id} className="text-sm border-l-2 border-black/10 pl-3">
                      <p>{a.text}</p>
                      <p className="text-xs text-black/40">{a.time}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}