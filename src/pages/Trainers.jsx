import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import ActionSelect from "@/components/ui/action-select";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import PageSkeleton from "@/components/PageSkeleton";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Eye, Trash2, Users, UserCheck, UserX, UserCog, Phone, Mail, Calendar, Activity, Power } from "lucide-react";
import { useTrainers } from "@/lib/trainerStore";
import { useMembers } from "@/lib/memberStore";
import { ghostBtn, input, label, primaryBtn, textarea } from "@/lib/uiClasses";

const cardBtn = "flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent";
const iconBtn = "rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
const emptyForm = { name: "", phone: "", email: "", specialization: "", joinDate: "", status: "Active", notes: "" };

export default function Trainers() {
  const { trainers, loading, createTrainer, updateTrainer, toggleTrainer, deleteTrainer, assignMember, removeMember } = useTrainers();
  const members = useMembers();
  const [formModal, setFormModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [membersModalId, setMembersModalId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const { toast } = useToast();

  // Derived from the live trainers array (not a captured snapshot) so the
  // modal reflects the new state immediately after assignMember/removeMember
  // triggers a reload inside useTrainers().
  const managingTrainer = useMemo(() => trainers.find((t) => t.id === membersModalId) || null, [trainers, membersModalId]);
  const assignedMemberList = useMemo(() => {
    if (!managingTrainer) return [];
    return managingTrainer.assignedMembers.map((id) => members.find((m) => m.id === id)).filter(Boolean);
  }, [managingTrainer, members]);
  const availableMembers = useMemo(() => {
    if (!managingTrainer) return [];
    const assignedSet = new Set(managingTrainer.assignedMembers);
    return members.filter((m) => !assignedSet.has(m.id));
  }, [managingTrainer, members]);

  const summary = useMemo(() => ({
    total: trainers.length,
    active: trainers.filter((t) => t.status === "Active").length,
    inactive: trainers.filter((t) => t.status === "Inactive").length,
  }), [trainers]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setFormError(""); setFormModal(true); };
  const openEdit = (t) => { setEditingId(t.id); setForm({ name: t.name, phone: t.phone, email: t.email, specialization: t.specialization, joinDate: t.joinDate, status: t.status, notes: t.notes || "" }); setFormError(""); setFormModal(true); };
  const openView = (t) => { setViewing(t); setDetailsModal(true); };
  const openManageMembers = (t) => { setMembersModalId(t.id); setSelectedMemberId(""); };
  const handleAssign = async () => {
    if (!selectedMemberId || !managingTrainer) return;
    setAssignBusy(true);
    try {
      await assignMember(managingTrainer.id, selectedMemberId);
      setSelectedMemberId("");
      toast({ title: "Member assigned" });
    } catch (error) {
      toast({ title: "Unable to assign member", description: error.message });
    } finally {
      setAssignBusy(false);
    }
  };
  const handleRemoveMember = async (memberId) => {
    if (!managingTrainer) return;
    try {
      await removeMember(managingTrainer.id, memberId);
      toast({ title: "Member removed" });
    } catch (error) {
      toast({ title: "Unable to remove member", description: error.message });
    }
  };
  const submit = async () => {
    if (!form.name.trim()) return setFormError("Trainer name is required");
    setBusy(true); setFormError("");
    try {
      if (editingId) { await updateTrainer(editingId, form); toast({ title: "Trainer updated", description: form.name }); }
      else { await createTrainer(form); toast({ title: "Trainer added successfully", description: form.name }); }
      setFormModal(false);
    } catch (error) { setFormError(error.message); }
    finally { setBusy(false); }
  };
  const toggleStatus = async (t) => {
    try { await toggleTrainer(t.id); const next = t.status === "Active" ? "Inactive" : "Active"; toast({ title: next === "Active" ? "Trainer activated" : "Trainer deactivated", description: t.name }); }
    catch (error) { toast({ title: "Unable to update trainer", description: error.message }); }
  };
  const remove = async (id) => {
    try { await deleteTrainer(id); toast({ title: "Trainer deleted" }); }
    catch (error) { toast({ title: "Unable to delete trainer", description: error.message }); }
  };

  const summaryCards = [
    { label: "Total Trainers", value: summary.total, icon: UserCog },
    { label: "Active Trainers", value: summary.active, icon: UserCheck },
    { label: "Inactive Trainers", value: summary.inactive, icon: UserX },
  ];

  if (loading) return <Layout><PageSkeleton cards={3} /></Layout>;

  return (
    <Layout>
      <div className="space-y-4 text-foreground sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Trainers</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage your gym trainers and the members they coach.</p>
          </div>
          <button onClick={openAdd} className={primaryBtn}>
            <Plus className="w-4 h-4" /> Add Trainer
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {summaryCards.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-muted-foreground"><s.icon className="w-4 h-4" /></div>
              <p className="text-xl font-bold tabular-nums sm:text-2xl">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {trainers.length === 0 ? (
          <EmptyState icon={UserCog} title="No trainers added" description="Add your first trainer to get started." actionLabel="Add Trainer" onAction={openAdd} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((t) => (
              <div key={t.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{initials(t.name)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.specialization}</p>
                    <div className="mt-1.5"><StatusBadge status={t.status} /></div>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t.phone}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t.email}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5 shrink-0" /> Joined {t.joinDate}</div>
                  <button type="button" onClick={() => openManageMembers(t)} className="flex items-center gap-2 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                    <Users className="h-3.5 w-3.5" /> {t.assigned} members assigned
                  </button>
                </div>
                <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
                  <button onClick={() => openView(t)} className={cardBtn}><Eye className="h-3.5 w-3.5" /> View</button>
                  <button onClick={() => openEdit(t)} className={cardBtn}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => setConfirm({ type: "delete", trainer: t })} className={iconBtn} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit */}
      <Modal open={formModal} onClose={() => setFormModal(false)} title={editingId ? "Edit Trainer" : "Add Trainer"}
        subtitle={editingId ? "Update this trainer's details." : "Add a trainer to your team."}
        icon={UserCog}
        footer={<>
          <button onClick={() => setFormModal(false)} className={ghostBtn}>Cancel</button>
          <button onClick={submit} disabled={busy} className={primaryBtn}>{busy ? "Saving…" : editingId ? "Save Trainer" : "Add Trainer"}</button>
        </>}>
        <div className="space-y-4">
          {formError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">{formError}</p>}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-accent/40 p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{form.name ? initials(form.name) : "—"}</div>
            <p className="text-xs text-muted-foreground">Initials are generated from the trainer's name.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className={label}>Full Name</label><input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="James Miller" /></div>
            <div><label className={label}>Phone</label><input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0200" /></div>
            <div><label className={label}>Email</label><input type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="james@olympicgym.com" /></div>
            <div><label className={label}>Specialty</label><input className={input} value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Strength Training" /></div>
            <div><label className={label}>Join Date</label><input type="date" className={input} value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} /></div>
            <div>
              <label className={label}>Status</label>
              <ActionSelect value={form.status} onChange={(status) => setForm({ ...form, status })} ariaLabel="Trainer status" title="Trainer status" options={["Active", "Inactive"]} />
            </div>
          </div>
          <div><label className={label}>Notes</label><textarea rows={2} className={textarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" /></div>
        </div>
      </Modal>

      {/* Details */}
      <Modal open={detailsModal} onClose={() => setDetailsModal(false)} title="Trainer Details" icon={UserCheck}
        footer={<>
          <button onClick={() => setDetailsModal(false)} className={ghostBtn}>Close</button>
          {viewing && <button onClick={() => { openEdit(viewing); setDetailsModal(false); }} className={primaryBtn}>Edit Trainer</button>}
        </>}>
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{initials(viewing.name)}</div>
              <div>
                <p className="text-lg font-semibold">{viewing.name}</p>
                <p className="text-sm text-muted-foreground">{viewing.specialization}</p>
                <div className="mt-1.5"><StatusBadge status={viewing.status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Phone</p><p className="mt-0.5 font-medium">{viewing.phone}</p></div>
              <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Email</p><p className="mt-0.5 truncate font-medium">{viewing.email}</p></div>
              <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Join Date</p><p className="mt-0.5 font-medium">{viewing.joinDate}</p></div>
              <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Members Assigned</p><p className="mt-0.5 font-medium tabular-nums">{viewing.assigned}</p></div>
            </div>
            {viewing.notes && <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Notes</p><p className="mt-0.5 text-sm">{viewing.notes}</p></div>}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Activity className="h-4 w-4" /> Recent Activity</h4>
              <div className="space-y-2">
                {viewing.activity.length === 0 ? <p className="text-xs text-muted-foreground">No recent activity.</p> :
                  viewing.activity.map((a) => (
                    <div key={a.id} className="border-l-2 border-border pl-3 text-sm"><p>{a.text}</p><p className="text-xs text-muted-foreground">{a.time}</p></div>
                  ))}
              </div>
            </div>
            <div className="flex gap-2 border-t border-border pt-3">
              <button onClick={() => setConfirm({ type: "toggle", trainer: viewing })} className={cardBtn}><Power className="h-4 w-4" /> {viewing.status === "Active" ? "Deactivate" : "Activate"}</button>
              <button onClick={() => { setConfirm({ type: "delete", trainer: viewing }); setDetailsModal(false); }} className={cardBtn}><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manage assigned members */}
      <Modal open={!!managingTrainer} onClose={() => setMembersModalId(null)} title={managingTrainer ? `${managingTrainer.name} — Assigned Members` : "Assigned Members"} icon={Users}
        footer={<button onClick={() => setMembersModalId(null)} className={ghostBtn}>Close</button>}>
        {managingTrainer && (
          <div className="space-y-4">
            <div>
              <label className={label}>Assign a member</label>
              <div className="flex gap-2">
                <ActionSelect
                  value={selectedMemberId}
                  onChange={setSelectedMemberId}
                  placeholder={availableMembers.length === 0 ? "No members available" : "Select a member…"}
                  ariaLabel="Assign a member"
                  title="Assign a member"
                  disabled={availableMembers.length === 0}
                  options={availableMembers.map((m) => ({ value: String(m.id), label: m.name }))}
                />
                <button onClick={handleAssign} disabled={!selectedMemberId || assignBusy} className={`${primaryBtn} shrink-0`}>{assignBusy ? "Assigning…" : "Assign"}</button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Currently assigned ({assignedMemberList.length})</p>
              {assignedMemberList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {assignedMemberList.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                      <span className="truncate text-sm">{m.name}</span>
                      <button onClick={() => handleRemoveMember(m.id)} className={iconBtn} title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.type === "delete") await remove(confirm.trainer.id);
          else if (confirm?.type === "toggle") await toggleStatus(confirm.trainer);
          setConfirm(null);
        }}
        title={confirm?.type === "delete" ? "Delete trainer?" : confirm?.trainer?.status === "Active" ? "Deactivate trainer?" : "Activate trainer?"}
        message={confirm?.type === "delete" ? `Are you sure you want to remove ${confirm?.trainer?.name}? This cannot be undone.` : confirm?.trainer?.status === "Active" ? `Deactivate ${confirm?.trainer?.name}? They will no longer be available for assignments.` : `Activate ${confirm?.trainer?.name}?`}
        confirmLabel={confirm?.type === "delete" ? "Delete" : confirm?.trainer?.status === "Active" ? "Deactivate" : "Activate"}
      />
    </Layout>
  );
}