import React, { useState } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import ActionSelect from "@/components/ui/action-select";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import PageSkeleton from "@/components/PageSkeleton";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Users, Calendar, Pencil, Eye, Power, CreditCard } from "lucide-react";
import { useGymAnalytics, useMembersLoaded, useMembersError, createMembershipPlan, updateMembershipPlan, toggleMembershipPlan } from "@/lib/memberStore";
import { ghostBtn, input, label, primaryBtn } from "@/lib/uiClasses";

const cardBtn = "flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent";
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
      <div className="space-y-4 text-foreground sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Membership</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage membership plans and pricing.</p>
          </div>
          <button onClick={openAdd} className={primaryBtn}>
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        </div>

        {loadError && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{loadError}</div>}

        {plans.length === 0 ? (
          <EmptyState icon={CreditCard} title="No membership plans" description="Create your first plan to get started." actionLabel="Add Plan" onAction={openAdd} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <StatusBadge status={p.status} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{p.duration}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {p.price == null ? "Custom" : `$${p.price}`}
                  {p.price != null && <span className="text-xs font-normal text-muted-foreground"> / plan</span>}
                </p>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {p.duration}</div>
                  <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> {p.activeMembers} active members</div>
                </div>
                <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
                  <button onClick={() => openView(p)} className={cardBtn}><Eye className="h-3.5 w-3.5" /> View</button>
                  <button onClick={() => openEdit(p)} className={cardBtn}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => setConfirm({ type: "toggle", plan: p })} className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title={p.status === "Active" ? "Deactivate" : "Activate"}><Power className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Plan" : "Add Plan"}
        subtitle="Plans control the price and duration members pick from." icon={CreditCard}
        footer={<>
          <button onClick={() => setModalOpen(false)} className={ghostBtn}>Cancel</button>
          <button onClick={submit} disabled={saving} className={primaryBtn}>{saving ? "Saving..." : editingId ? "Save Plan" : "Add Plan"}</button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className={label}>Plan Name</label>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Price ($)</label>
              <input type="number" className={input} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="60" />
            </div>
            <div>
              <label className={label}>Duration (months)</label>
              <input type="number" min="1" className={input} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="1" />
            </div>
          </div>
          <div>
            <label className={label}>Status</label>
            <ActionSelect value={form.status} onChange={(status) => setForm({ ...form, status })} ariaLabel="Plan status" title="Plan status" options={["Active", "Inactive"]} />
          </div>
        </div>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Plan Details" icon={Calendar}
        footer={<>
          <button onClick={() => setViewOpen(false)} className={ghostBtn}>Close</button>
          {viewing && <button onClick={() => { openEdit(viewing); setViewOpen(false); }} className={primaryBtn}>Edit Plan</button>}
        </>}>
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><h3 className="text-xl font-bold">{viewing.name}</h3><p className="text-sm text-muted-foreground">{viewing.duration}</p></div>
              <p className="text-3xl font-bold tabular-nums">{viewing.price == null ? "Custom" : `$${viewing.price}`}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Active Members</p><p className="mt-0.5 text-lg font-bold tabular-nums">{viewing.activeMembers}</p></div>
              <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={viewing.status} /></div></div>
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