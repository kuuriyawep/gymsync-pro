import React, { useState } from "react";
import Layout from "@/components/Layout";
import { User, Building2, CreditCard, Bell, Shield, Mail, Phone, MapPin, Monitor, LogOut, UserCog, Plus, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SaveButton from "@/components/SaveButton";
import PhotoPicker from "@/components/PhotoPicker";
import { useGym, setGym } from "@/lib/gymStore";
import { base44 } from "@/api/base44Client";
import { staff as mockStaff, staffRoles, staffPermissions } from "@/lib/mockData";

const sections = [
  { id: "profile", label: "Profile", icon: User, desc: "Your personal account and password" },
  { id: "gym", label: "Gym Profile", icon: Building2, desc: "Your gym's information and branding" },
  { id: "membership", label: "Membership", icon: CreditCard, desc: "Default currency and payment method" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Choose which alerts you receive" },
  { id: "security", label: "Security", icon: Shield, desc: "Password, active sessions and sign out" },
  { id: "staff", label: "Staff & Access", icon: UserCog, desc: "Invite staff and manage their gym access" },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, desc: "Irreversible account actions" },
];

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";
const Toggle = ({ on, onClick }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onClick}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-black/10 transition-colors ${on ? "bg-black" : "bg-black/10"}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);
const Field = ({ label, children }) => (<div><label className={labelCls}>{label}</label>{children}</div>);

const sessions = [
  { id: 1, device: "Chrome · macOS", location: "San Francisco, CA", current: true, time: "Active now" },
  { id: 2, device: "Safari · iPhone", location: "San Francisco, CA", current: false, time: "2h ago" },
  { id: 3, device: "Edge · Windows", location: "New York, NY", current: false, time: "3d ago" },
];

export default function Settings() {
  const [active, setActive] = useState("profile");
  const [notif, setNotif] = useState({ expiry: true, payments: true, newMembers: true });
  const gymStore = useGym();
  const [gym, setGymLocal] = useState(gymStore);
  const [profile, setProfile] = useState({ name: "Alex Kovac", email: "alex@olympicgym.com", phone: "+1 555 0100", photoUrl: null });
  const [membership, setMembership] = useState({ currency: "USD", method: "Mobile Money", defaultPlan: "Monthly", autoRenew: false });
  const [staff, setStaff] = useState(mockStaff);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "Front Desk" });
  const [revoke, setRevoke] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toast } = useToast();

  const inviteStaff = () => {
    if (!invite.email.trim()) return;
    const id = Math.max(...staff.map((s) => s.id), 0) + 1;
    const name = invite.email.split("@")[0].split(/[._-]/).map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
    setStaff((ss) => [...ss, { id, name, email: invite.email.trim(), role: invite.role, status: "Invited", lastActive: "—" }]);
    setInviteOpen(false);
    setInvite({ email: "", role: "Front Desk" });
    toast({ title: "Invite sent", description: `${invite.email} was invited as ${invite.role}.` });
  };
  const activeItem = sections.find((s) => s.id === active);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-black/50 mt-0.5">Manage your account and gym preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-56 shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {sections.map((s) => (
                <button key={s.id} onClick={() => setActive(s.id)} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active === s.id ? "text-white" : "text-black/70 hover:bg-black/5"}`}>
                  {active === s.id && <motion.span layoutId="settings-pill" className="absolute inset-0 rounded-lg bg-black" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <span className="relative flex items-center gap-3"><s.icon className="w-4.5 h-4.5" />{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{activeItem.label}</h2>
              <p className="text-sm text-black/50">{activeItem.desc}</p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="min-h-[300px]">

                {active === "profile" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <PhotoPicker value={profile.photoUrl} onChange={(url) => setProfile({ ...profile, photoUrl: url })} onRemove={() => setProfile({ ...profile, photoUrl: null })} size="w-16 h-16" placeholder="AK" hint="JPG or PNG. Max 2MB." />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Full name"><input className={inputCls} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
                      <Field label="Email"><input className={inputCls} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
                      <Field label="Phone"><input className={inputCls} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
                      <Field label="Role"><input className={inputCls} defaultValue="Owner" disabled /></Field>
                    </div>
                    <div className="pt-4 border-t border-black/5">
                      <h3 className="font-semibold mb-3 text-sm">Change Password</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Current"><input type="password" className={inputCls} placeholder="••••••••" /></Field>
                        <Field label="New"><input type="password" className={inputCls} placeholder="••••••••" /></Field>
                        <Field label="Confirm"><input type="password" className={inputCls} placeholder="••••••••" /></Field>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2"><SaveButton onSave={() => toast({ title: "Profile updated", description: "Your profile has been updated." })} /></div>
                  </div>
                )}

                {active === "gym" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                      <PhotoPicker value={gym.logoUrl} onChange={(url) => setGymLocal({ ...gym, logoUrl: url })} onRemove={() => setGymLocal({ ...gym, logoUrl: null })} shape="rounded" size="w-16 h-16" placeholder="OG" hint="PNG or JPG. Max 1MB." />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Gym name"><input className={inputCls} value={gym.name} onChange={(e) => setGymLocal({ ...gym, name: e.target.value })} /></Field>
                        <Field label="Phone"><input className={inputCls} value={gym.phone} onChange={(e) => setGymLocal({ ...gym, phone: e.target.value })} /></Field>
                        <Field label="Email"><input className={inputCls} value={gym.email} onChange={(e) => setGymLocal({ ...gym, email: e.target.value })} /></Field>
                        <Field label="Address"><input className={inputCls} value={gym.address} onChange={(e) => setGymLocal({ ...gym, address: e.target.value })} /></Field>
                        <div className="sm:col-span-2"><Field label="Description"><textarea rows={3} className={inputCls} value={gym.description} onChange={(e) => setGymLocal({ ...gym, description: e.target.value })} /></Field></div>
                      </div>
                      <div className="flex justify-end pt-2"><SaveButton label="Save profile" successLabel="Saved" onSave={() => { setGym(gym); toast({ title: "Gym profile saved", description: "Your gym information has been updated." }); }} /></div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5">
                      <h3 className="font-semibold mb-3 text-sm">Preview</h3>
                      <div className="flex items-start gap-4 p-4 border border-black/10 rounded-xl">
                        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center text-lg font-bold overflow-hidden">{gym.logoUrl ? <img src={gym.logoUrl} alt="" className="w-full h-full object-cover" /> : "OG"}</div>
                        <div><p className="font-semibold">{gym.name}</p><p className="text-xs text-black/50 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {gym.address}</p><p className="text-xs text-black/50 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {gym.phone} · <Mail className="w-3 h-3" /> {gym.email}</p></div>
                      </div>
                    </div>
                  </div>
                )}

                {active === "membership" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Default currency"><select className={inputCls} value={membership.currency} onChange={(e) => setMembership({ ...membership, currency: e.target.value })}><option value="USD">USD - US Dollar</option><option value="EUR">EUR - Euro</option><option value="GBP">GBP - British Pound</option><option value="SOS">SOS - Somali Shilling</option></select></Field>
                      <Field label="Default payment method"><select className={inputCls} value={membership.method} onChange={(e) => setMembership({ ...membership, method: e.target.value })}><option>Cash</option><option>Mobile Money</option><option>Card</option><option>Other</option></select></Field>
                      <Field label="Default membership plan"><select className={inputCls} value={membership.defaultPlan} onChange={(e) => setMembership({ ...membership, defaultPlan: e.target.value })}><option>Monthly</option><option>3 Months</option><option>6 Months</option></select></Field>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div><p className="text-sm font-medium">Auto-renew memberships</p><p className="text-xs text-black/50">Automatically renew members on expiry</p></div>
                      <Toggle on={membership.autoRenew} onClick={() => setMembership({ ...membership, autoRenew: !membership.autoRenew })} />
                    </div>
                    <div className="flex justify-end pt-2"><SaveButton onSave={() => toast({ title: "Membership settings saved", description: "Your membership defaults have been updated." })} /></div>
                  </div>
                )}

                {active === "notifications" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-1">
                    {[
                      { key: "expiry", label: "Expiry reminders", desc: "Get notified before a membership expires" },
                      { key: "payments", label: "Payment notifications", desc: "Alerts for payments and overdue accounts" },
                      { key: "newMembers", label: "New member notifications", desc: "Get notified when a member joins your gym" },
                    ].map((n) => (
                      <div key={n.key} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                        <div className="pr-4"><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-black/50">{n.desc}</p></div>
                        <Toggle on={notif[n.key]} onClick={() => { setNotif({ ...notif, [n.key]: !notif[n.key] }); toast({ title: `${n.label} ${!notif[n.key] ? "enabled" : "disabled"}` }); }} />
                      </div>
                    ))}
                  </div>
                )}

                {active === "security" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <h3 className="font-semibold mb-3 text-sm">Password</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Current"><input type="password" className={inputCls} placeholder="••••••••" /></Field>
                        <Field label="New"><input type="password" className={inputCls} placeholder="••••••••" /></Field>
                        <Field label="Confirm"><input type="password" className={inputCls} placeholder="••••••••" /></Field>
                      </div>
                      <div className="flex justify-end mt-4"><SaveButton label="Update password" successLabel="Updated" onSave={() => toast({ title: "Password updated", description: "Your password has been changed." })} /></div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <h3 className="font-semibold mb-4 text-sm">Active Sessions</h3>
                      <div className="space-y-3">
                        {sessions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-3 border border-black/10 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center"><Monitor className="w-4 h-4" /></div>
                              <div><p className="text-sm font-medium">{s.device} {s.current && <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black text-white">Current</span>}</p><p className="text-xs text-black/50">{s.location} · {s.time}</p></div>
                            </div>
                            {!s.current && <button onClick={() => toast({ title: "Session revoked" })} className="text-xs font-medium text-black/60 hover:text-black">Revoke</button>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <button onClick={() => base44.auth.logout("/login")} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5"><LogOut className="w-4 h-4" /> Sign out</button>
                    </div>
                  </div>
                )}

                {active === "staff" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2"><UserCog className="w-5 h-5" /><h3 className="font-semibold text-sm">Staff & Access</h3></div>
                        <button onClick={() => setInviteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90"><Plus className="w-4 h-4" /> Invite</button>
                      </div>
                      <p className="text-xs text-black/50 mb-4">Staff belong to your gym and are invited by you. They help manage your gym but are not gym owners.</p>
                      <div className="space-y-2">
                        {staff.map((s) => (
                          <div key={s.id} className="flex items-center gap-3 p-3 border border-black/10 rounded-lg">
                            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">{s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{s.name} {s.role === "Owner" && <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black text-white">You</span>}</p>
                              <p className="text-xs text-black/50 truncate">{s.email} · {s.lastActive}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/5 text-black/70">{s.role}</span>
                            {s.role !== "Owner" && <button onClick={() => setRevoke(s)} className="text-black/40 hover:text-black p-1.5 rounded-lg hover:bg-black/5"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {active === "danger" && (
                  <div className="border border-black/15 rounded-xl p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-5 h-5" /><h3 className="font-semibold text-sm">Delete Account</h3></div>
                    <p className="text-sm text-black/50 mb-4">Permanently delete your GymSync account and all associated gym data. This action cannot be undone.</p>
                    <button onClick={() => setDeleteOpen(true)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black text-black hover:bg-black hover:text-white transition-colors">Delete account</button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite staff"
        footer={<>
          <button onClick={() => setInviteOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={inviteStaff} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Send invite</button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input className={inputCls} value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="staff@olympicgym.com" type="email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Role</label>
            <select className={inputCls} value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
              {staffRoles.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="bg-black/[0.02] rounded-lg p-3">
            <p className="text-xs font-semibold mb-1.5">This role can:</p>
            <ul className="space-y-1">
              {staffPermissions[invite.role].can.map((c) => <li key={c} className="text-xs text-black/60 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-black" /> {c}</li>)}
            </ul>
          </div>
          <p className="text-xs text-black/40">Staff are not gym owners. They can only access what you allow.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!revoke}
        onClose={() => setRevoke(null)}
        onConfirm={() => { setStaff((ss) => ss.filter((s) => s.id !== revoke.id)); toast({ title: "Access revoked", description: revoke?.name }); setRevoke(null); }}
        title="Revoke staff access?"
        message={`Remove ${revoke?.name} from your gym? They will lose access immediately.`}
        confirmLabel="Revoke"
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { setDeleteOpen(false); toast({ title: "Account deletion requested", description: "This is a demo — no data was deleted." }); }}
        title="Delete your account?"
        message="This permanently deletes your account and all gym data. This action cannot be undone."
        confirmLabel="Delete account"
      />
    </Layout>
  );
}