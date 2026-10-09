import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { User, Building2, CreditCard, Bell, Shield, Mail, Phone, MapPin, Monitor, LogOut, UserCog, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import SaveButton from "@/components/SaveButton";
import PhotoPicker from "@/components/PhotoPicker";
import { useGym, setGym, setNotificationSettings } from "@/lib/gymStore";
import { useAuth } from "@/lib/AuthContext";
import StaffAccessPanel from "@/components/settings/StaffAccessPanel";
import StaffInviteModal from "@/components/settings/StaffInviteModal";
import StaffProfileModal from "@/components/settings/StaffProfileModal";
import { useStaffAccess } from "@/lib/staffStore";
import ProfileImage from "@/components/ProfileImage";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import { supabase } from "@/lib/supabaseClient";

const sections = [
  { id: "profile", label: "Profile", icon: User, desc: "Your personal account details" },
  { id: "gym", label: "Gym Profile", icon: Building2, desc: "Your gym's information and branding" },
  { id: "membership", label: "Membership", icon: CreditCard, desc: "Default currency and payment method" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Choose which alerts you receive" },
  { id: "security", label: "Security", icon: Shield, desc: "Password, active sessions and sign out" },
  { id: "staff", label: "Staff & Access", icon: UserCog, desc: "Invite staff and manage their gym access" },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, desc: "Irreversible account actions" },
];

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";
const Toggle = ({ on, onClick, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-black/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "bg-black" : "bg-black/10"}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);
const Field = ({ label, children }) => (<div><label className={labelCls}>{label}</label>{children}</div>);

export default function Settings() {
  const location = useLocation();
  const requestedTab = new URLSearchParams(location.search).get("tab");
  const [active, setActive] = useState(requestedTab && sections.some((section) => section.id === requestedTab) ? requestedTab : null);
  const gymStore = useGym();
  const [gym, setGymLocal] = useState(gymStore);
  const { staff, loading: staffLoading, loadError: staffLoadError, invite: inviteStaff, update: updateStaff, revoke: revokeStaff } = useStaffAccess();
  const { user, profile, reloadRole, logout } = useAuth();
  const [profileDraft, setProfileDraft] = useState({ full_name: "", phone: "", avatar_url: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ fullName: "", email: "", role: "Front Desk" });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [revoke, setRevoke] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffSaving, setStaffSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (requestedTab === "gym") setActive("gym");
  }, [requestedTab]);

  useEffect(() => {
    setGymLocal(gymStore);
  }, [gymStore]);

  useEffect(() => {
    setProfileDraft({ full_name: profile?.full_name || user?.user_metadata?.full_name || "", phone: profile?.phone || "", avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || "" });
  }, [profile, user]);

  const saveOwnerProfile = async () => {
    if (!user?.id) throw new Error("Your session has expired. Please sign in again.");
    const fullName = profileDraft.full_name.trim();
    if (!fullName) throw new Error("Full name is required.");
    setProfileSaving(true);
    try {
      const { data, error } = await supabase.from("profiles").update({ full_name: fullName, phone: profileDraft.phone.trim() || null, avatar_url: profileDraft.avatar_url || null }).eq("id", user.id).select("id, role, gym_id, staff_role, full_name, phone, avatar_url").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Profile was not saved. Check that your account profile exists and try again.");
      const { error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName, avatar_url: data.avatar_url } });
      if (authError) throw authError;
      await reloadRole();
      setProfileDraft({ full_name: data.full_name || "", phone: data.phone || "", avatar_url: data.avatar_url || "" });
      toast({ title: "Profile saved", description: "Your account details and photo have been saved." });
    } finally { setProfileSaving(false); }
  };

  const handleInviteStaff = async () => {
    if (!invite.fullName.trim()) { toast({ title: "Invite failed", description: "Full name is required." }); return; }
    if (!invite.email.trim()) { toast({ title: "Invite failed", description: "Email is required." }); return; }
    setInviteSaving(true);
    try { await inviteStaff(invite.fullName.trim(), invite.email.trim(), invite.role); setInviteOpen(false); setInvite({ fullName: "", email: "", role: "Front Desk" }); toast({ title: "Staff access created", description: `${invite.fullName} can now sign in with Google using ${invite.email.trim()} on any device.` }); }
    catch (error) { toast({ title: "Invite failed", description: error.message }); }
    finally { setInviteSaving(false); }
  };
  const activeItem = sections.find((s) => s.id === active);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-black/50 mt-0.5">Manage your account and gym preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 lg:gap-6 items-start">
          <div className="w-full lg:col-start-2 lg:row-start-1 bg-white border border-black/10 rounded-xl p-3 md:p-4">
            <div className="grid grid-cols-1 gap-1">
              {sections.map((s) => (
                <button key={s.id} data-settings-section={s.id} onClick={() => setActive(s.id)} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active === s.id ? "text-white" : "text-black/70 hover:bg-black/5"}`}>
                  {active === s.id && <motion.span layoutId="settings-pill" className="absolute inset-0 rounded-lg bg-black" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <span className="relative flex items-center gap-3"><s.icon className="w-4.5 h-4.5" />{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {active && activeItem && <div className="flex-1 min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="mb-4 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{activeItem.label}</h2>
                <p className="text-sm text-black/50">{activeItem.desc}</p>
              </div>
              <button type="button" onClick={() => setActive(null)} className="shrink-0 rounded-lg border border-black/15 px-3 py-2 text-xs font-medium hover:bg-black/5">All settings</button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="min-h-[300px]">

                {active === "profile" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <PhotoPicker value={profileDraft.avatar_url} onChange={(avatar_url) => setProfileDraft((current) => ({ ...current, avatar_url }))} onRemove={() => setProfileDraft((current) => ({ ...current, avatar_url: "" }))} size="w-24 h-24" placeholder={(profileDraft.full_name || user?.email || "O").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()} hint="Choose a clear profile photo. JPG, PNG or another image format, max 10 MB." />
                    <div className="space-y-4">
                      <Field label="Full name"><input className={inputCls} autoComplete="name" value={profileDraft.full_name} onChange={(e) => setProfileDraft((current) => ({ ...current, full_name: e.target.value }))} /></Field>
                      <Field label="Email"><input className={inputCls} value={user?.email || ""} disabled /></Field>
                      <Field label="Phone"><input className={inputCls} type="tel" autoComplete="tel" value={profileDraft.phone} onChange={(e) => setProfileDraft((current) => ({ ...current, phone: e.target.value }))} placeholder="Enter phone number" /></Field>
                      <Field label="Role"><input className={inputCls} value={profile?.role === "owner" ? "Owner" : profile?.role || "Account"} disabled /></Field>
                    </div>
                    <div className="flex justify-end pt-3"><button type="button" disabled={profileSaving} onClick={async () => { try { await saveOwnerProfile(); } catch (error) { toast({ title: "Could not save profile", description: error.message || "Please try again." }); } }} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}{profileSaving ? "Saving..." : "Save profile"}</button></div>
                    <div className="pt-4 border-t border-black/5">
                      <p className="text-sm text-black/50">Your name, phone number and profile photo are saved to your account. Email and role are managed securely by your account settings.</p>
                    </div>
                  </div>
                )}

                {active === "gym" && (gymStore.isLoading ? (
                  <div className="flex items-center gap-2 py-12 text-sm text-black/50"><Loader2 className="w-4 h-4 animate-spin" /> Loading gym profile...</div>
                ) : gymStore.loadError ? (
                  <div className="border border-black/10 rounded-xl p-5 text-sm text-black/60">{gymStore.loadError}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                      <PhotoPicker value={gym.logoUrl} onChange={(url) => setGymLocal({ ...gym, logoUrl: url })} onRemove={() => setGymLocal({ ...gym, logoUrl: null })} shape="rounded" size="w-24 h-24" placeholder="OG" hint="PNG or JPG. Max 1MB." />
                      <div className="space-y-4">
                        <Field label="Gym name"><input className={inputCls} value={gym.name} onInput={(e) => setGymLocal({ ...gym, name: e.target.value })} /></Field>
                        <Field label="Phone"><input className={inputCls} value={gym.phone} onInput={(e) => setGymLocal({ ...gym, phone: e.target.value })} /></Field>
                        <Field label="Email"><input className={inputCls} value={gym.email} onInput={(e) => setGymLocal({ ...gym, email: e.target.value })} /></Field>
                        <Field label="Address"><input data-testid="gym-address" className={inputCls} value={gym.address} onInput={(e) => setGymLocal({ ...gym, address: e.target.value })} /></Field>
                      </div>
                      <div className="flex justify-end pt-2"><SaveButton label="Save profile" successLabel="Saved" onSave={async () => { const saved = await setGym(gym); setGymLocal(saved); toast({ title: "Gym profile saved", description: "Your gym information has been updated." }); }} /></div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5">
                      <h3 className="font-semibold mb-3 text-sm">Preview</h3>
                      <div className="flex items-start gap-4 p-4 border border-black/10 rounded-xl">
                        <ProfileImage src={gym.logoUrl} alt={gym.name} fallback="OG" className="w-14 h-14 text-lg" shape="rounded" dark />
                        <div className="space-y-1 min-w-0"><p className="font-semibold">{gym.name}</p>{gym.address && <p className="text-xs text-black/50 flex items-start gap-1 break-words"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {gym.address}</p>}{gym.phone && <p className="text-xs text-black/50 flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" /> {gym.phone}</p>}{gym.email && <p className="text-xs text-black/50 flex items-start gap-1 break-all"><Mail className="w-3 h-3 mt-0.5 shrink-0" /> {gym.email}</p>}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {active === "membership" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <div className="space-y-4">
                      <Field label="Default currency"><select className={inputCls} value="" disabled><option value="">Not configured</option></select></Field>
                      <Field label="Default payment method"><select className={inputCls} value="" disabled><option value="">Not configured</option></select></Field>
                      <Field label="Default membership plan"><select className={inputCls} value="" disabled><option value="">Not configured</option></select></Field>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div><p className="text-sm font-medium">Auto-renew memberships</p><p className="text-xs text-black/50">Automatically renew members on expiry</p></div>
                      <Toggle on={false} disabled />
                    </div>
                    <p className="text-sm text-black/50">Membership defaults are not supported by the current gym settings storage, so these controls are unavailable.</p>
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
                        <Toggle
                          on={Boolean(gym.notifications?.[n.key])}
                          disabled={notificationSaving}
                          onClick={async () => {
                            const next = { ...(gym.notifications || {}), [n.key]: !Boolean(gym.notifications?.[n.key]) };
                            setNotificationSaving(true);
                            try {
                              const saved = await setNotificationSettings(next);
                              setGymLocal((current) => ({ ...current, notifications: saved.notifications }));
                              toast({ title: "Notification settings saved" });
                            } catch (error) {
                              toast({ title: "Could not save notification settings", description: error.message || "Please try again." });
                            } finally {
                              setNotificationSaving(false);
                            }
                          }}
                        />
                      </div>
                    ))}
                    <p className="pt-3 text-sm text-black/50">These preferences are saved to your gym and control which workspace alerts are shown.</p>
                  </div>
                )}

                {active === "security" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <h3 className="font-semibold mb-2 text-sm">Password</h3>
                      <p className="text-sm text-black/50">Direct password changes are unavailable for this app's authentication method. Use the secure password reset flow instead.</p>
                      <div className="flex justify-end mt-4"><Link to="/forgot-password" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Reset password</Link></div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <h3 className="font-semibold mb-4 text-sm">Active Sessions</h3>
                      <div className="flex items-center gap-3 p-3 border border-black/10 rounded-lg">
                        <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center"><Monitor className="w-4 h-4" /></div>
                        <div><p className="text-sm font-medium">Session details unavailable</p><p className="text-xs text-black/50">The current authentication provider does not expose active device or session information.</p></div>
                      </div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <button onClick={() => logout()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5"><LogOut className="w-4 h-4" /> Sign out</button>
                    </div>
                  </div>
                )}

                {active === "staff" && <StaffAccessPanel staff={staff} loading={staffLoading} loadError={staffLoadError} onInvite={() => setInviteOpen(true)} onOpenStaff={setSelectedStaff} onRevoke={setRevoke} />}

                {active === "danger" && (
                  <div className="border border-black/15 rounded-xl p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-5 h-5" /><h3 className="font-semibold text-sm">Delete Account</h3></div>
                    <p className="text-sm text-black/50 mb-4">Permanently delete your GymSync account and all associated gym data. This action cannot be undone.</p>
                    <button onClick={() => setDeleteOpen(true)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black text-black hover:bg-black hover:text-white transition-colors">Delete account</button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>}
        </div>
      </div>

      <StaffInviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} invite={invite} setInvite={setInvite} onSubmit={handleInviteStaff} saving={inviteSaving} />

      <StaffProfileModal
        staff={selectedStaff ? (staff.find((item) => item.id === selectedStaff.id) || selectedStaff) : null}
        open={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        saving={staffSaving}
        onSave={async (updated) => {
          setStaffSaving(true);
          try {
            await updateStaff(updated);
            setSelectedStaff((current) => current ? { ...current, ...updated } : null);
            toast({ title: "Staff profile updated", description: "Name, photo and role have been saved." });
          } catch (error) {
            toast({ title: "Could not update staff", description: error.message || "Please try again." });
          } finally {
            setStaffSaving(false);
          }
        }}
      />

      <ConfirmDialog
        open={!!revoke}
        onClose={() => setRevoke(null)}
        onConfirm={async () => { try { await revokeStaff(revoke.id); toast({ title: "Access revoked", description: revoke?.name }); } catch (error) { toast({ title: "Revoke failed", description: error.message }); } setRevoke(null); }}
        title="Revoke staff access?"
        message={`Remove ${revoke?.name} from your gym? They will lose access immediately.`}
        confirmLabel="Revoke"
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteSaving(false); setDeleteOpen(false); }}
        onConfirm={async () => {
          setDeleteSaving(true);
          try {
            await invokeWithAuth("gymAccess", { operation: "deleteAccount" });
            toast({ title: "Account deleted", description: "Your gym data has been permanently removed." });
            setDeleteOpen(false);
            await logout();
            window.location.href = "/welcome";
          } catch (error) {
            toast({ title: "Deletion failed", description: error.message || "Could not delete account." });
          } finally {
            setDeleteSaving(false);
          }
        }}
        title="Delete your account?"
        message="This permanently deletes your account and all gym data. This action cannot be undone."
        confirmLabel={deleteSaving ? "Deleting…" : "Delete account"}
      />
    </Layout>
  );
}