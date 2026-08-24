import React, { useState } from "react";
import Layout from "@/components/Layout";
import { User, Building2, CreditCard, Bell, Shield, Mail, Phone, MapPin, Camera, Monitor, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const sections = [
  { id: "profile", label: "Profile", icon: User, desc: "Your personal account and password" },
  { id: "gym", label: "Gym Profile", icon: Building2, desc: "Your gym's information and branding" },
  { id: "membership", label: "Membership", icon: CreditCard, desc: "Default currency and payment method" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Choose which alerts you receive" },
  { id: "security", label: "Security", icon: Shield, desc: "Password, active sessions and sign out" },
];

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";
const Toggle = ({ on, onClick }) => (
  <button onClick={onClick} className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-black" : "bg-black/15"}`}>
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
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
  const [gym, setGym] = useState({ name: "Olympic Gym", phone: "+1 555 0100", email: "info@olympicgym.com", address: "120 Market St, San Francisco, CA", description: "A premium fitness center offering strength training, cardio, group classes and personal training." });
  const [membership, setMembership] = useState({ currency: "USD", method: "Mobile Money", defaultPlan: "Monthly", autoRenew: false });
  const { toast } = useToast();
  const handleSave = (msg) => toast({ title: msg || "Changes saved", description: "Your settings have been updated." });
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
              <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

                {active === "profile" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold">AK</div>
                      <div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5"><Camera className="w-4 h-4" /> Change photo</button>
                        <p className="text-xs text-black/40 mt-1.5">JPG or PNG. Max 2MB.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Full name"><input className={inputCls} defaultValue="Alex Kovac" /></Field>
                      <Field label="Email"><input className={inputCls} defaultValue="alex@olympicgym.com" /></Field>
                      <Field label="Phone"><input className={inputCls} defaultValue="+1 555 0100" /></Field>
                      <Field label="Role"><input className={inputCls} defaultValue="Owner" disabled /></Field>
                    </div>
                    <div className="pt-4 border-t border-black/5">
                      <h3 className="font-semibold mb-3 text-sm">Change Password</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Current"><input type="password" className={inputCls} defaultValue="password" /></Field>
                        <Field label="New"><input type="password" className={inputCls} /></Field>
                        <Field label="Confirm"><input type="password" className={inputCls} /></Field>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2"><button onClick={() => handleSave("Profile updated")} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Save changes</button></div>
                  </div>
                )}

                {active === "gym" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-black text-white flex items-center justify-center text-xl font-bold">OG</div>
                        <div>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5"><Camera className="w-4 h-4" /> Upload logo</button>
                          <p className="text-xs text-black/40 mt-1.5">PNG or SVG. Max 1MB.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Gym name"><input className={inputCls} value={gym.name} onChange={(e) => setGym({ ...gym, name: e.target.value })} /></Field>
                        <Field label="Phone"><input className={inputCls} value={gym.phone} onChange={(e) => setGym({ ...gym, phone: e.target.value })} /></Field>
                        <Field label="Email"><input className={inputCls} value={gym.email} onChange={(e) => setGym({ ...gym, email: e.target.value })} /></Field>
                        <Field label="Address"><input className={inputCls} value={gym.address} onChange={(e) => setGym({ ...gym, address: e.target.value })} /></Field>
                        <div className="sm:col-span-2"><Field label="Description"><textarea rows={3} className={inputCls} value={gym.description} onChange={(e) => setGym({ ...gym, description: e.target.value })} /></Field></div>
                      </div>
                      <div className="flex justify-end pt-2"><button onClick={() => handleSave("Gym profile saved")} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Save profile</button></div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5">
                      <h3 className="font-semibold mb-3 text-sm">Preview</h3>
                      <div className="flex items-start gap-4 p-4 border border-black/10 rounded-xl">
                        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center text-lg font-bold">OG</div>
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
                    <div className="flex justify-end pt-2"><button onClick={() => handleSave("Membership settings saved")} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Save changes</button></div>
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
                        <Toggle on={notif[n.key]} onClick={() => setNotif({ ...notif, [n.key]: !notif[n.key] })} />
                      </div>
                    ))}
                  </div>
                )}

                {active === "security" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <h3 className="font-semibold mb-3 text-sm">Password</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Current"><input type="password" className={inputCls} defaultValue="password" /></Field>
                        <Field label="New"><input type="password" className={inputCls} /></Field>
                        <Field label="Confirm"><input type="password" className={inputCls} /></Field>
                      </div>
                      <div className="flex justify-end mt-4"><button onClick={() => handleSave("Password updated")} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Update password</button></div>
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
                            {!s.current && <button className="text-xs font-medium text-black/60 hover:text-black">Revoke</button>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <button onClick={() => toast({ title: "Signed out", description: "You have been signed out (mock)." })} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5"><LogOut className="w-4 h-4" /> Sign out</button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}