import React, { useEffect, useState } from "react";
import { CalendarDays, Clock3, Mail, ShieldCheck, UserRound, Pencil, Save, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import PhotoPicker from "@/components/PhotoPicker";
import ProfileImage from "@/components/ProfileImage";

const roles = ["Manager", "Front Desk", "Cashier"];
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black";

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
      <button type="button" onClick={() => { setDraft({ name: staff.name || "", role: staff.role || "Front Desk", avatarUrl: staff.avatarUrl || null }); setEditing(false); }} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
      <button type="button" onClick={save} disabled={saving || !draft.name.trim()} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes</button>
    </> : <>
      <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Close</button>
      <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white"><Pencil className="w-4 h-4" /> Edit profile</button>
    </>}
  </>}>
    <div className="space-y-5">
      <div className="flex items-center gap-4 pb-4 border-b border-black/10">
        {editing ? <PhotoPicker value={draft.avatarUrl} onChange={(avatarUrl) => setDraft((current) => ({ ...current, avatarUrl }))} onRemove={() => setDraft((current) => ({ ...current, avatarUrl: null }))} placeholder={draft.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()} hint="Choose a profile image." /> : <ProfileImage src={staff.avatarUrl} alt={staff.name} fallback={staff.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()} className="w-20 h-20 text-xl" />}
        <div className="min-w-0"><h4 className="font-semibold text-lg break-words">{editing ? "Update profile" : staff.name}</h4><p className="text-sm text-black/50 break-all">{staff.email}</p><span className="inline-flex mt-2 px-2 py-1 rounded-full bg-black/5 text-xs font-medium">{staff.status}</span></div>
      </div>
      <div className="space-y-4">
        <div><label className="block text-xs font-medium text-black/50 mb-1.5">Full name</label>{editing ? <input maxLength={120} className={inputCls} value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} /> : <div className="flex items-center gap-2 text-sm"><UserRound className="w-4 h-4 text-black/45" />{staff.name}</div>}</div>
        <div><label className="block text-xs font-medium text-black/50 mb-1.5">Email address</label><div className="flex items-center gap-2 text-sm break-all"><Mail className="w-4 h-4 text-black/45 shrink-0" />{staff.email || "Not available"}</div><p className="text-xs text-black/40 mt-1">Email is linked to sign-in and cannot be changed here.</p></div>
        <div><label className="block text-xs font-medium text-black/50 mb-1.5">Role</label>{editing ? <select className={inputCls} value={draft.role} onChange={(e) => setDraft((current) => ({ ...current, role: e.target.value }))}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select> : <div className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-black/45" />{staff.role}</div>}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-black/10 p-3"><div className="flex items-center gap-2 text-xs text-black/50 mb-1"><CalendarDays className="w-3.5 h-3.5" /> Added to gym</div><p className="text-sm font-medium">{dateLabel(staff.createdAt)}</p></div>
          <div className="rounded-lg border border-black/10 p-3"><div className="flex items-center gap-2 text-xs text-black/50 mb-1"><Clock3 className="w-3.5 h-3.5" /> First joined</div><p className="text-sm font-medium">{dateLabel(staff.joinedAt)}</p></div>
        </div>
        <p className="text-xs text-black/45">Last active: {staff.lastActive || "Never recorded"}. Exact last-login time is not currently tracked by the app.</p>
      </div>
    </div>
  </Modal>;
}
