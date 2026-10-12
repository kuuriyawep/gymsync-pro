import React from "react";
import Modal from "@/components/ui/Modal";
import { UserCog } from "lucide-react";
import { ghostBtn, input, label, primaryBtn } from "@/lib/uiClasses";

const roles = ["Manager", "Front Desk", "Cashier"];
const permissions = { Manager: ["Manage members and memberships", "Record payments", "View reports"], "Front Desk": ["Manage members"], Cashier: ["Record and view payments"] };

export default function StaffInviteModal({ open, onClose, invite, setInvite, onSubmit, saving }) {
  return <Modal open={open} onClose={onClose} title="Invite staff" subtitle="Create sign-in access for a team member." icon={UserCog}
    footer={<><button onClick={onClose} className={ghostBtn}>Cancel</button><button onClick={onSubmit} disabled={saving} className={primaryBtn}>{saving ? "Sending…" : "Send invite"}</button></>}>
    <div className="space-y-4">
      <div><label className={label}>Full name</label><input className={input} value={invite.fullName || ""} onChange={(event) => setInvite({ ...invite, fullName: event.target.value })} placeholder="Ahmed Ali" type="text" /></div>
      <div><label className={label}>Email</label><input className={input} value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="staff@example.com" type="email" /></div>
      <div><label className={label}>Role</label><select className={input} value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></div>
      <div className="rounded-xl border border-border bg-accent p-3">
        <p className="mb-1.5 text-xs font-semibold">This role can:</p>
        {permissions[invite.role].map((item) => <p key={item} className="py-0.5 text-xs text-muted-foreground">• {item}</p>)}
        <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">After access is created, staff should sign in with Google using this same email on their device.</p>
      </div>
    </div>
  </Modal>;
}