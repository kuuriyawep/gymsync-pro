import React, { useState } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import PageSkeleton from "@/components/PageSkeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Users, Calendar, Check, Pencil, Eye, Power, CreditCard } from "lucide-react";
import { useGymAnalytics, useMembersLoaded, useMembersError, createMembershipPlan, updateMembershipPlan, toggleMembershipPlan } from "@/lib/memberStore";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";
const emptyForm = { name: "", price: "", duration: "1", status: "Active" };

export default function Membership() {
  const analytics = useGymAnalytics();
  const loaded = useMembersLoaded();
  const loadError = useMembersError();
  const plans = analytics.plans || [];
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState(null);
  const { toast } = useToast();

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p) => { setEditingId(p.id); setForm({ name: p.name, price: p.price == null ? "" : String(p.price), duration: String(parseInt(p.duration, 10) || 1), status: p.status }); setModalOpen(true); };
  const openView = (p) => { setViewing(p); setViewOpen(true); };

  const submit = async () => {
    if (!form.name.trim() || form.price === "" || Number(form.price) < 0 || Number(form.duration) < 1) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateMembershipPlan(editingId, form);
        toast({ title: "Plan updated", description: `${form.name} saved successfully` });
      } else {
        await createMembershipPlan(form);
        toast({ title: "Plan added successfully", description: `${form.name} created` });
      }
      setModalOpen(false);
    } catch (error) {
      toast({ title: "Unable to save plan", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleStatus = async (p) => {
    try {
      await toggleMembershipPlan(p.id);
      const next = p.status === "Active" ? "Inactive" : "Active";
      toast({ title: next === "Active" ? "Plan activated" : "Plan deactivated", description: p.name });
    } catch (error) {
      toast({ title: "Unable to update plan", description: error.message, variant: "destructive" });
    }
  };

  if (!loaded) return <Layout><PageSkeleton cards={3} rows={3} /></Layout>;

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Membership</h1>
            <p className="text-sm text-black/50 mt-0.5">Manage membership plans and pricing</p>
          </div>
          <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        </div>

        {loadError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{loadError}</div>}

        {plans.length === 0 ? (
          <EmptyState icon={CreditCard} title="No membership plans" description="Create your first plan to get started." actionLabel="Add Plan" onAction={openAdd} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="bg-white border border-black/10 rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${p.status === "Active" ? "bg-emerald-600 text-white" : "bg-black/5 text-black/50"}`}>
                    {p.status === "Active" && <Check className="w-3 h-3" />} {p.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-3xl font-bold mt-1">
                  {p.price == null ? "Custom" : `$${p.price}`}
                  {p.price != null && <span className="text-xs font-normal text-black/40"> / plan</span>}
                </p>
                <div className="flex items-center gap-2 text-xs text-black/50 mt-2"><Calendar className="w-3.5 h-3.5" /> {p.duration}</div>
                <div className="flex items-center gap-2 text-xs text-black/50 mt-1"><Users className="w-3.5 h-3.5" /> {p.activeMembers} active members</div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5">
                  <button onClick={() => openView(p)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-black/15 hover:bg-black/5"><Eye className="w-3.5 h-3.5" /> View</button>
                  <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-black/15 hover:bg-black/5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => setConfirm({ type: "toggle", plan: p })} className="p-2 rounded-lg border border-black/15 hover:bg-black/5" title={p.status === "Active" ? "Deactivate" : "Activate"}><Power className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Plan" : "Add Plan"}
        footer={<>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90 disabled:opacity-60">{saving ? "Saving..." : editingId ? "Save Plan" : "Add Plan"}</button>
        </>}>
        <div className="space-y-4">
          <div><label className={labelCls}>Plan Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Price ($)</label>
              <input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="60" /></div>
            <div><label className={labelCls}>Duration</label>
              <input type="number" min="1" className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="1" /></div>
          </div>
          <div><label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Active</option><option>Inactive</option>
            </select></div>
        </div>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Plan Details"
        footer={<>
          <button onClick={() => setViewOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Close</button>
          {viewing && <button onClick={() => { openEdit(viewing); setViewOpen(false); }} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Edit Plan</button>}
        </>}>
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><h3 className="text-xl font-bold">{viewing.name}</h3><p className="text-sm text-black/50">{viewing.duration}</p></div>
              <p className="text-3xl font-bold">{viewing.price == null ? "Custom" : `$${viewing.price}`}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-black/10 rounded-lg p-3"><p className="text-xs text-black/40">Active Members</p><p className="text-lg font-bold mt-0.5">{viewing.activeMembers}</p></div>
              <div className="border border-black/10 rounded-lg p-3"><p className="text-xs text-black/40">Status</p><span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${viewing.status === "Active" ? "bg-emerald-600 text-white" : "bg-black/5 text-black/50"}`}>{viewing.status}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm?.plan) toggleStatus(confirm.plan); setConfirm(null); }}
        title={confirm?.plan?.status === "Active" ? "Deactivate plan?" : "Activate plan?"}
        message={confirm?.plan?.status === "Active" ? `Are you sure you want to deactivate "${confirm?.plan?.name}"? It will no longer be available for new members.` : `Activate "${confirm?.plan?.name}"? It will be available for new members.`}
        confirmLabel={confirm?.plan?.status === "Active" ? "Deactivate" : "Activate"}
      />
    </Layout>
  );
}