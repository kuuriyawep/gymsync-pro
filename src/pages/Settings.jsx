import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { User, Shield, Bell, Building2, CreditCard, Palette, Globe, DollarSign, Check, ArrowRight, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { plans } from "@/lib/mockData";

const groups = [
  {
    label: "Account",
    items: [
      { id: "profile", label: "Profile", icon: User, desc: "Your personal account details" },
      { id: "security", label: "Security", icon: Shield, desc: "Password, 2FA and active sessions" },
      { id: "notifications", label: "Notifications", icon: Bell, desc: "Choose which alerts you receive" },
    ],
  },
  {
    label: "Gym",
    items: [
      { id: "gymProfile", label: "Gym Profile", icon: Building2, desc: "Your gym's information and branding" },
      { id: "plans", label: "Membership Plans", icon: CreditCard, desc: "Overview of your membership plans" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme and display preferences" },
      { id: "language", label: "Language", icon: Globe, desc: "App display language" },
      { id: "currency", label: "Currency", icon: DollarSign, desc: "Default currency for your gym" },
    ],
  },
];

const Toggle = ({ on, onClick }) => (
  <button onClick={onClick} className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-black" : "bg-black/15"}`}>
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);
const Field = ({ label, children }) => (
  <div><label className="block text-sm font-medium mb-1.5">{label}</label>{children}</div>
);
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

const sessions = [
  { id: 1, device: "Chrome · macOS", location: "San Francisco, CA", current: true, time: "Active now" },
  { id: 2, device: "Safari · iPhone", location: "San Francisco, CA", current: false, time: "2h ago" },
  { id: 3, device: "Edge · Windows", location: "New York, NY", current: false, time: "3d ago" },
];

export default function Settings() {
  const [active, setActive] = useState("profile");
  const [notif, setNotif] = useState({ newMembers: true, payments: true, lowAttendance: false, reports: true });
  const [twoFA, setTwoFA] = useState(true);
  const [appearance, setAppearance] = useState("Light");
  const [gymProfile, setGymProfile] = useState({
    name: "Olympic Gym", phone: "+1 555 0100", email: "info@olympicgym.com",
    address: "120 Market St, San Francisco, CA", openHours: "05:00", closeHours: "23:00",
    description: "A premium fitness center offering strength training, cardio, group classes and personal training.",
  });
  const { toast } = useToast();
  const handleSave = () => toast({ title: "Changes saved", description: "Your settings have been updated successfully." });
  const activeItem = groups.flatMap((g) => g.items).find((s) => s.id === active);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-black/50 mt-0.5">Manage your account and gym preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section nav */}
          <div className="lg:w-56 shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {groups.map((g) => (
                <div key={g.label} className="flex lg:flex-col gap-1">
                  <p className="hidden lg:block px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">{g.label}</p>
                  {g.items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActive(s.id)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active === s.id ? "text-white" : "text-black/70 hover:bg-black/5"}`}
                    >
                      {active === s.id && <motion.span layoutId="settings-pill" className="absolute inset-0 rounded-lg bg-black" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                      <span className="relative flex items-center gap-3"><s.icon className="w-4.5 h-4.5" />{s.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{activeItem.label}</h2>
              <p className="text-sm text-black/50">{activeItem.desc}</p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

                {active === "profile" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <h3 className="font-semibold">Owner Profile</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold">AK</div>
                      <div>
                        <button className="px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Change photo</button>
                        <p className="text-xs text-black/40 mt-1.5">JPG or PNG. Max 2MB.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Full name"><input className={inputCls} defaultValue="Alex Kovac" /></Field>
                      <Field label="Email"><input className={inputCls} defaultValue="alex@olympicgym.com" /></Field>
                      <Field label="Phone"><input className={inputCls} defaultValue="+1 555 0100" /></Field>
                      <Field label="Role"><input className={inputCls} defaultValue="Owner" disabled /></Field>
                      <Field label="Account created"><input className={inputCls} defaultValue="Jan 12, 2025" disabled /></Field>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Save changes</button>
                    </div>
                  </div>
                )}

                {active === "security" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                      <h3 className="font-semibold">Change Password</h3>
                      <div className="space-y-4">
                        <Field label="Current password"><input type="password" className={inputCls} defaultValue="password" /></Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="New password"><input type="password" className={inputCls} /></Field>
                          <Field label="Confirm new password"><input type="password" className={inputCls} /></Field>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Update password</button>
                      </div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <div className="flex items-center justify-between">
                        <div className="pr-4">
                          <p className="text-sm font-medium">Two-factor authentication</p>
                          <p className="text-xs text-black/50">Add an extra layer of security to your account</p>
                        </div>
                        <Toggle on={twoFA} onClick={() => setTwoFA(!twoFA)} />
                      </div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <h3 className="font-semibold mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        {sessions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-3 border border-black/10 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center"><Monitor className="w-4 h-4" /></div>
                              <div>
                                <p className="text-sm font-medium">{s.device} {s.current && <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black text-white">Current</span>}</p>
                                <p className="text-xs text-black/50">{s.location} · {s.time}</p>
                              </div>
                            </div>
                            {!s.current && <button className="text-xs font-medium text-black/60 hover:text-black">Revoke</button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {active === "notifications" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-1">
                    <h3 className="font-semibold mb-4">Notification Preferences</h3>
                    {[
                      { key: "newMembers", label: "New member sign-ups", desc: "Get notified when a member joins" },
                      { key: "payments", label: "Payment alerts", desc: "Failed or successful payments" },
                      { key: "lowAttendance", label: "Low attendance warnings", desc: "When attendance drops below 60% capacity" },
                      { key: "reports", label: "Weekly reports", desc: "Summary of your gym every Monday" },
                    ].map((n) => (
                      <div key={n.key} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                        <div className="pr-4"><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-black/50">{n.desc}</p></div>
                        <Toggle on={notif[n.key]} onClick={() => setNotif({ ...notif, [n.key]: !notif[n.key] })} />
                      </div>
                    ))}
                  </div>
                )}

                {active === "gymProfile" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <h3 className="font-semibold">Gym Profile</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-black text-white flex items-center justify-center text-xl font-bold">OG</div>
                      <div>
                        <button className="px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Upload logo</button>
                        <p className="text-xs text-black/40 mt-1.5">PNG or SVG. Max 1MB.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Gym name"><input className={inputCls} value={gymProfile.name} onChange={(e) => setGymProfile({ ...gymProfile, name: e.target.value })} /></Field>
                      <Field label="Phone"><input className={inputCls} value={gymProfile.phone} onChange={(e) => setGymProfile({ ...gymProfile, phone: e.target.value })} /></Field>
                      <Field label="Email"><input className={inputCls} value={gymProfile.email} onChange={(e) => setGymProfile({ ...gymProfile, email: e.target.value })} /></Field>
                      <Field label="Address"><input className={inputCls} value={gymProfile.address} onChange={(e) => setGymProfile({ ...gymProfile, address: e.target.value })} /></Field>
                      <Field label="Opening hours"><input type="time" className={inputCls} value={gymProfile.openHours} onChange={(e) => setGymProfile({ ...gymProfile, openHours: e.target.value })} /></Field>
                      <Field label="Closing hours"><input type="time" className={inputCls} value={gymProfile.closeHours} onChange={(e) => setGymProfile({ ...gymProfile, closeHours: e.target.value })} /></Field>
                      <div className="sm:col-span-2"><Field label="Description"><textarea rows={3} className={inputCls} value={gymProfile.description} onChange={(e) => setGymProfile({ ...gymProfile, description: e.target.value })} /></Field></div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Save profile</button>
                    </div>
                  </div>
                )}

                {active === "plans" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div><h3 className="font-semibold">Membership Plans</h3><p className="text-xs text-black/50">Overview of your active plans</p></div>
                        <Link to="/membership" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Manage plans <ArrowRight className="w-4 h-4" /></Link>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {plans.map((p) => (
                          <div key={p.id} className="border border-black/10 rounded-xl p-4">
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-2xl font-bold mt-1">{p.price == null ? "Custom" : `$${p.price}`}</p>
                            <p className="text-xs text-black/50 mt-2">{p.duration} · {p.activeMembers} members</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {active === "appearance" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <h3 className="font-semibold">Appearance</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">Theme</label>
                      <div className="flex items-center gap-2">
                        {["Light", "Dark", "System"].map((t) => (
                          <button key={t} onClick={() => setAppearance(t)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${appearance === t ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{t}</button>
                        ))}
                      </div>
                      <p className="text-xs text-black/40 mt-2">Theme preference is saved for display only.</p>
                    </div>
                  </div>
                )}

                {active === "language" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <h3 className="font-semibold">Language</h3>
                    <Field label="Display language">
                      <select className={inputCls} defaultValue="English">
                        <option>English</option><option>Spanish</option><option>French</option><option>Arabic</option><option>Somali</option>
                      </select>
                    </Field>
                    <div className="flex justify-end pt-2"><button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Save changes</button></div>
                  </div>
                )}

                {active === "currency" && (
                  <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                    <h3 className="font-semibold">Currency</h3>
                    <Field label="Default currency">
                      <select className={inputCls} defaultValue="USD">
                        <option value="USD">USD - US Dollar</option><option value="EUR">EUR - Euro</option><option value="GBP">GBP - British Pound</option><option value="SOS">SOS - Somali Shilling</option>
                      </select>
                    </Field>
                    <div className="flex justify-end pt-2"><button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Save changes</button></div>
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