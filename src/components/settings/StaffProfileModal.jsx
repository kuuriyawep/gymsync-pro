import React, { useEffect, useState } from "react";
import { CalendarDays, Clock3, Mail, ShieldCheck, UserRound, Pencil, Save, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import PhotoPicker from "@/components/PhotoPicker";
import ProfileImage from "@/components/ProfileImage";
import { ghostBtn, input, label, primaryBtn } from "@/lib/uiClasses";

const roles = ["Manager", "Front Desk", "Cashier"];

function dateLabel(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function StaffProfileModal({ staff, open, onClose, onSave, saving = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", role: "Front Desk", avatarUrl: null });
  useEffect(() => {
    if (staff) setDraft({ name: staff.name || "", role: staff.role || "Front Desk", avatarUrl: staff.avatarUrl || null });
    setEditing(false);
  }, [staff, open]);

  if (!staff) return null;
  const save = async () => {
    try {
      await onSave({ ...staff, ...draft });
      setEditing(false);
    } catch {
      // Keep the form open so the owner can correct the issue or retry.
    }
  };

  return <Modal open={open} onClose={onClose} title="Staff profile" footer={<>
    {editing ? <>
      <button type="button" onClick={() => { setDraft({ name: staff.name || "", role: staff.role || "Front Desk", avatarUrl: staff.avatarUrl || null }); setEditing(false); }} disabled={saving} className={ghostBtn}>Cancel</button>
      <button type="button" onClick={save} disabled={saving || !draft.name.trim()} className={primaryBtn}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes</button>
    </> : <>
      <button type="button" onClick={onClose} className={ghostBtn}>Close</button>
      <button type="button" onClick={() => setEditing(true)} className={primaryBtn}><Pencil className="w-4 h-4" /> Edit profile</button>
    </>}
  </>}>
    <div className="space-y-5">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        {editing ? <PhotoPicker value={draft.avatarUrl} onChange={(avatarUrl) => setDraft((current) => ({ ...current, avatarUrl }))} onRemove={() => setDraft((current) => ({ ...current, avatarUrl: null }))} placeholder={draft.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()} hint="Choose a profile image." /> : <ProfileImage src={staff.avatarUrl} alt={staff.name} fallback={staff.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()} className="w-20 h-20 text-xl" dark />}
        <div className="min-w-0"><h4 className="break-words text-lg font-semibold">{editing ? "Update profile" : staff.name}</h4><p className="break-all text-sm text-muted-foreground">{staff.email}</p><span className="mt-2 inline-flex rounded-full bg-accent px-2 py-1 text-xs font-medium">{staff.status}</span></div>
      </div>
      <div className="space-y-4">
        <div><label className={label}>Full name</label>{editing ? <input maxLength={120} className={input} value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} /> : <div className="flex items-center gap-2 text-sm"><UserRound className="w-4 h-4 text-muted-foreground" />{staff.name}</div>}</div>
        <div><label className={label}>Email address</label><div className="flex items-center gap-2 break-all text-sm"><Mail className="w-4 h-4 shrink-0 text-muted-foreground" />{staff.email || "Not available"}</div><p className="mt-1 text-xs text-muted-foreground">Email is linked to sign-in and cannot be changed here.</p></div>
        <div><label className={label}>Role</label>{editing ? <select className={input} value={draft.role} onChange={(e) => setDraft((current) => ({ ...current, role: e.target.value }))}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select> : <div className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-muted-foreground" />{staff.role}</div>}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3"><div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="w-3.5 h-3.5" /> Added to gym</div><p className="text-sm font-medium">{dateLabel(staff.createdAt)}</p></div>
          <div className="rounded-xl border border-border p-3"><div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="w-3.5 h-3.5" /> First joined</div><p className="text-sm font-medium">{dateLabel(staff.joinedAt)}</p></div>
        </div>
        <p className="text-xs text-muted-foreground">Last active: {staff.lastActive || "Never recorded"}. Exact last-login time is not currently tracked by the app.</p>
      </div>
    </div>
  </Modal>;
}