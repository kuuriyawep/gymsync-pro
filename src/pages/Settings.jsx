import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { User, Building2, CreditCard, Bell, Shield, Mail, Phone, MapPin, Monitor, LogOut, UserCog, AlertTriangle, Loader2, ChevronRight, HelpCircle, Info, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import SaveButton from "@/components/SaveButton";
import PhotoPicker from "@/components/PhotoPicker";
import { useGym, setGym, setNotificationSettings, setMembershipDefaults } from "@/lib/gymStore";
import { useAuth } from "@/lib/AuthContext";
import StaffAccessPanel from "@/components/settings/StaffAccessPanel";
import StaffInviteModal from "@/components/settings/StaffInviteModal";
import StaffProfileModal from "@/components/settings/StaffProfileModal";
import { useStaffAccess } from "@/lib/staffStore";
import ProfileImage from "@/components/ProfileImage";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import { supabase } from "@/lib/supabaseClient";
import { card, ghostBtn, input, label, primaryBtn, sectionLabel } from "@/lib/uiClasses";

const APP_VERSION = "GymSync Pro v1.0.0";

// Grouped the way the owner thinks about settings: the gym itself, who can get
// in, and everything about the account.
const groups = [
  {
    id: "gym-management",
    title: "Gym Management",
    items: [
      { id: "gym", label: "Gym Profile", icon: Building2, desc: "Update your gym information, logo and details." },
      { id: "membership", label: "Membership Defaults", icon: CreditCard, desc: "Set default plans, prices and durations." },
      { id: "notifications", label: "Notifications", icon: Bell, desc: "Manage alerts and email notifications." },
    ],
  },
  {
    id: "security-access",
    title: "Security & Access",
    items: [
      { id: "security", label: "Security", icon: Shield, desc: "Change password and security settings." },
      { id: "staff", label: "Staff & Access", icon: UserCog, desc: "Invite staff and manage permissions." },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { id: "profile", label: "Owner Profile", icon: User, desc: "Your name, phone number and photo." },
      { id: "danger", label: "Danger Zone", icon: AlertTriangle, desc: "Irreversible account actions." },
    ],
  },
  {
    id: "system",
    title: "System",
    items: [
      { to: "/support", label: "Help & Support", icon: HelpCircle, desc: "Get help or contact our support team." },
      { to: "/about", label: "About", icon: Info, desc: APP_VERSION },
    ],
  },
];
const sections = groups.flatMap((group) => group.items.filter((item) => item.id));

const Toggle = ({ on, onClick, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "bg-emerald-500" : "bg-accent"}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform ${on ? "translate-x-5 bg-emerald-950" : "translate-x-0.5 bg-muted-foreground"}`} />
  </button>
);
const Field = ({ children, title }) => (<div><label className={label}>{title}</label>{children}</div>);
const Panel = ({ children, className = "" }) => (<div className={`${card} p-5 sm:p-6 ${className}`}>{children}</div>);

export default function Settings() {
  const [active, setActive] = useState(null);
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
  const [membershipSaving, setMembershipSaving] = useState(false);
  const [membershipDraft, setMembershipDraft] = useState(gymStore.membershipDefaults);
  const { toast } = useToast();

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab && sections.some((section) => section.id === requestedTab)) setActive(requestedTab);
  }, []);

  useEffect(() => {
    setGymLocal(gymStore);
    setMembershipDraft(gymStore.membershipDefaults || { currency: "USD", paymentMethod: "cash", membershipPlanId: "", autoRenew: false });
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
      // The profiles row is canonical. Metadata is a convenience fallback for
      // account surfaces; a metadata sync failure must not report a failed save
      // after the database has already persisted the profile.
      await supabase.auth.updateUser({ data: { full_name: fullName, avatar_url: data.avatar_url } }).catch(() => null);
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

  const listRow = "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent";

  return (
    <Layout dark>
      <div className="space-y-5 text-foreground">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage your gym settings and preferences.</p>
        </div>

        {/* Gym identity card */}
        <button onClick={() => setActive("gym")} className={`${card} flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent`}>
          <ProfileImage src={gym.logoUrl} alt={gym.name} fallback="OG" className="h-12 w-12 text-base" shape="rounded" dark />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{gym.isLoading ? "Loading…" : gym.name || "Your gym"}</p>
            <span className="mt-0.5 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gym Owner</span>
            <div className="mt-1 space-y-0.5">
              {gym.address && <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><MapPin className="w-3 h-3 shrink-0" /> {gym.address}</p>}
              {gym.email && <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><Mail className="w-3 h-3 shrink-0" /> {gym.email}</p>}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
        </button>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Section list */}
          {(
            <div className={`space-y-4 lg:col-start-2 lg:row-start-1 ${active ? "hidden lg:block" : ""}`}>
              {groups.map((group) => (
                <div key={group.id}>
                  <p className={`${sectionLabel} mb-2 px-1`}>{group.title}</p>
                  <div className={`${card} divide-y divide-border overflow-hidden`}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const row = (
                        <>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-muted-foreground"><Icon className="w-4 h-4" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{item.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{item.desc}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                        </>
                      );
                      return item.to ? (
                        <Link key={item.to} to={item.to} className={listRow}>{row}</Link>
                      ) : (
                        <button key={item.id} data-settings-section={item.id} onClick={() => setActive(item.id)} className={listRow}>{row}</button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button onClick={() => logout()} className={`${card} flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400"><LogOut className="w-4 h-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Log Out</span>
                  <span className="block text-xs text-muted-foreground">Sign out from your account.</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Active section */}
          {active && activeItem && (
            <div className="min-w-0 flex-1 lg:col-start-1 lg:row-start-1">
              <button onClick={() => setActive(null)} className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground lg:hidden">
                <ChevronRight className="w-4 h-4 rotate-180" /> All settings
              </button>
              <div className="mb-4 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-lg font-semibold">{activeItem.label}</h2>
                  <p className="text-sm text-muted-foreground">{activeItem.desc}</p>
                </div>
                <button type="button" onClick={() => setActive(null)} className={`${ghostBtn} hidden !px-3 !py-1.5 !text-xs lg:inline-flex`}>All settings</button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="min-h-[300px]">

                  {active === "profile" && (
                    <Panel className="space-y-5">
                      <PhotoPicker value={profileDraft.avatar_url} onChange={(avatar_url) => setProfileDraft((current) => ({ ...current, avatar_url }))} onRemove={() => setProfileDraft((current) => ({ ...current, avatar_url: "" }))} size="w-24 h-24" placeholder={(profileDraft.full_name || user?.email || "O").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()} hint="Choose a clear profile photo. JPG, PNG or another image format, max 10 MB." />
                      <div className="space-y-4">
                        <Field title="Full name"><input className={input} autoComplete="name" value={profileDraft.full_name} onChange={(e) => setProfileDraft((current) => ({ ...current, full_name: e.target.value }))} /></Field>
                        <Field title="Email"><input className={input} value={user?.email || ""} disabled /></Field>
                        <Field title="Phone"><input className={input} type="tel" autoComplete="tel" value={profileDraft.phone} onChange={(e) => setProfileDraft((current) => ({ ...current, phone: e.target.value }))} placeholder="Enter phone number" /></Field>
                        <Field title="Role"><input className={input} value={profile?.role === "owner" ? "Owner" : profile?.role || "Account"} disabled /></Field>
                      </div>
                      <div className="flex justify-end pt-1"><button type="button" disabled={profileSaving} onClick={async () => { try { await saveOwnerProfile(); } catch (error) { toast({ title: "Could not save profile", description: error.message || "Please try again." }); } }} className={primaryBtn}>{profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}{profileSaving ? "Saving..." : "Save profile"}</button></div>
                      <p className="border-t border-border pt-4 text-sm text-muted-foreground">Your name, phone number and profile photo are saved to your account. Email and role are managed securely by your account settings.</p>
                    </Panel>
                  )}

                  {active === "gym" && (gymStore.isLoading ? (
                    <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading gym profile...</div>
                  ) : gymStore.loadError ? (
                    <Panel><p className="text-sm text-muted-foreground">{gymStore.loadError}</p></Panel>
                  ) : (
                    <div className="space-y-4">
                      <Panel className="space-y-5">
                        <PhotoPicker value={gym.logoUrl} onChange={(url) => setGymLocal({ ...gym, logoUrl: url })} onRemove={() => setGymLocal({ ...gym, logoUrl: null })} shape="rounded" size="w-24 h-24" placeholder="OG" hint="PNG or JPG. Max 1MB." />
                        <div className="space-y-4">
                          <Field title="Gym name"><input className={input} value={gym.name} onInput={(e) => setGymLocal({ ...gym, name: e.target.value })} /></Field>
                          <Field title="Phone"><input className={input} value={gym.phone} onInput={(e) => setGymLocal({ ...gym, phone: e.target.value })} /></Field>
                          <Field title="Email"><input className={input} value={gym.email} onInput={(e) => setGymLocal({ ...gym, email: e.target.value })} /></Field>
                          <Field title="Address"><input data-testid="gym-address" className={input} value={gym.address} onInput={(e) => setGymLocal({ ...gym, address: e.target.value })} /></Field>
                        </div>
                        <div className="flex justify-end"><SaveButton label="Save profile" successLabel="Saved" onSave={async () => { const saved = await setGym(gym); setGymLocal(saved); toast({ title: "Gym profile saved", description: "Your gym information has been updated." }); }} /></div>
                      </Panel>
                      <Panel>
                        <h3 className="mb-3 text-sm font-semibold">Preview</h3>
                        <div className="flex items-start gap-4 rounded-xl border border-border p-4">
                          <ProfileImage src={gym.logoUrl} alt={gym.name} fallback="OG" className="w-14 h-14 text-lg" shape="rounded" dark />
                          <div className="min-w-0 space-y-1"><p className="font-semibold">{gym.name}</p>{gym.address && <p className="flex items-start gap-1 break-words text-xs text-muted-foreground"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {gym.address}</p>}{gym.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3 shrink-0" /> {gym.phone}</p>}{gym.email && <p className="flex items-start gap-1 break-all text-xs text-muted-foreground"><Mail className="w-3 h-3 mt-0.5 shrink-0" /> {gym.email}</p>}</div>
                        </div>
                      </Panel>
                    </div>
                  ))}

                  {active === "membership" && (
                    <Panel className="space-y-5">
                      <div className="space-y-4">
                        <Field title="Default currency"><select className={input} value={membershipDraft.currency || "USD"} onChange={(e) => setMembershipDraft((current) => ({ ...current, currency: e.target.value }))} disabled={membershipSaving}><option value="USD">USD — US Dollar</option><option value="SOS">SOS — Somali Shilling</option><option value="ETB">ETB — Ethiopian Birr</option><option value="KES">KES — Kenyan Shilling</option><option value="AED">AED — UAE Dirham</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option></select></Field>
                        <Field title="Default payment method"><select className={input} value={membershipDraft.paymentMethod || "cash"} onChange={(e) => setMembershipDraft((current) => ({ ...current, paymentMethod: e.target.value }))} disabled={membershipSaving}><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option></select></Field>
                        <Field title="Default membership plan"><select className={input} value={membershipDraft.membershipPlanId || ""} onChange={(e) => setMembershipDraft((current) => ({ ...current, membershipPlanId: e.target.value }))} disabled={membershipSaving}><option value="">No default plan</option>{(gymStore.membershipPlans || []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.durationMonths} month{plan.durationMonths === 1 ? "" : "s"} · {Number(plan.price).toLocaleString()} {membershipDraft.currency || "USD"}</option>)}</select>{gymStore.membershipPlans?.length === 0 && <p className="mt-1 text-xs text-muted-foreground">No active membership plans found. Create or activate a plan to choose a default.</p>}</Field>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <div><p className="text-sm font-medium">Auto-renew memberships</p><p className="text-xs text-muted-foreground">Save the preference for future renewal workflows</p></div>
                        <Toggle on={Boolean(membershipDraft.autoRenew)} disabled={membershipSaving} onClick={() => setMembershipDraft((current) => ({ ...current, autoRenew: !current.autoRenew }))} />
                      </div>
                      <div className="flex justify-end"><button type="button" disabled={membershipSaving} onClick={async () => { setMembershipSaving(true); try { const saved = await setMembershipDefaults(membershipDraft); setMembershipDraft(saved.membershipDefaults); toast({ title: "Membership settings saved", description: "Your defaults have been saved to this gym." }); } catch (error) { toast({ title: "Could not save membership settings", description: error?.response?.data?.error || error.message || "Please try again." }); } finally { setMembershipSaving(false); } }} className={primaryBtn}>{membershipSaving && <Loader2 className="w-4 h-4 animate-spin" />}{membershipSaving ? "Saving..." : "Save settings"}</button></div>
                      <p className="text-sm text-muted-foreground">These defaults are saved for this gym. Auto-renew is stored as a preference; automatic billing or membership renewal is not activated by this setting alone.</p>
                    </Panel>
                  )}

                  {active === "notifications" && (
                    <Panel>
                      {[
                        { key: "expiry", label: "Expiry reminders", desc: "Get notified before a membership expires" },
                        { key: "payments", label: "Payment notifications", desc: "Alerts for payments and overdue accounts" },
                        { key: "newMembers", label: "New member notifications", desc: "Get notified when a member joins your gym" },
                      ].map((n) => (
                        <div key={n.key} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                          <div className="pr-4"><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
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
                      <p className="pt-3 text-sm text-muted-foreground">These preferences are saved to your gym and control which workspace alerts are shown.</p>
                    </Panel>
                  )}

                  {active === "security" && (
                    <div className="space-y-4">
                      <Panel>
                        <h3 className="mb-2 text-sm font-semibold">Password</h3>
                        <p className="text-sm text-muted-foreground">Direct password changes are unavailable for this app's authentication method. Use the secure password reset flow instead.</p>
                        <div className="mt-4 flex justify-end"><Link to="/forgot-password" className={primaryBtn}>Reset password</Link></div>
                      </Panel>
                      <Panel>
                        <h3 className="mb-4 text-sm font-semibold">Active Sessions</h3>
                        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-muted-foreground"><Monitor className="w-4 h-4" /></span>
                          <div><p className="text-sm font-medium">Session details unavailable</p><p className="text-xs text-muted-foreground">The current authentication provider does not expose active device or session information.</p></div>
                        </div>
                      </Panel>
                      <Panel>
                        <button onClick={() => logout()} className={ghostBtn}><LogOut className="w-4 h-4" /> Sign out</button>
                      </Panel>
                    </div>
                  )}

                  {active === "staff" && <StaffAccessPanel staff={staff} loading={staffLoading} loadError={staffLoadError} onInvite={() => setInviteOpen(true)} onOpenStaff={setSelectedStaff} onRevoke={setRevoke} />}

                  {active === "danger" && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 sm:p-6">
                      <div className="mb-1 flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" /><h3 className="text-sm font-semibold">Delete Account</h3></div>
                      <p className="mb-4 text-sm text-muted-foreground">Permanently delete your GymSync account and all associated gym data. This action cannot be undone.</p>
                      <button onClick={() => setDeleteOpen(true)} className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">Delete account</button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
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