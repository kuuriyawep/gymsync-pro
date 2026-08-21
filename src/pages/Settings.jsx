import React, { useState } from "react";
import Layout from "@/components/Layout";
import { User, Building2, Bell, Shield, CreditCard, Globe, Check, Plus, Pencil, Trash2, X } from "lucide-react";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "gymProfile", label: "Gym Profile", icon: Building2 },
  { id: "plans", label: "Membership Plans", icon: CreditCard },
  { id: "gyms", label: "Gym Settings", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "regional", label: "Regional", icon: Globe },
];

const Toggle = ({ on, onClick }) => (
  <button
    onClick={onClick}
    className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-black" : "bg-black/15"}`}
  >
    <span
      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        on ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

export default function Settings() {
  const [active, setActive] = useState("profile");
  const [notif, setNotif] = useState({ newMembers: true, payments: true, lowAttendance: false, reports: true });
  const [twoFA, setTwoFA] = useState(true);

  const [gymProfile, setGymProfile] = useState({ name: "IronHub Downtown", address: "120 Market St, San Francisco, CA", currency: "USD" });

  const [plans, setPlans] = useState([
    { id: 1, name: "Basic", price: 40, features: "Gym access · 2 classes/week" },
    { id: 2, name: "Standard", price: 60, features: "Gym access · Unlimited classes" },
    { id: 3, name: "VIP", price: 120, features: "All access · Personal trainer · Sauna" },
  ]);
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: "", price: "", features: "" });

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: "", price: "", features: "" });
    setPlanModal(true);
  };
  const openEditPlan = (p) => {
    setEditingPlan(p.id);
    setPlanForm({ name: p.name, price: p.price, features: p.features });
    setPlanModal(true);
  };
  const submitPlan = () => {
    if (!planForm.name.trim()) return;
    if (editingPlan) {
      setPlans((ps) => ps.map((p) => (p.id === editingPlan ? { ...p, ...planForm, price: Number(planForm.price) || 0 } : p)));
    } else {
      setPlans((ps) => [...ps, { id: Date.now(), ...planForm, price: Number(planForm.price) || 0 }]);
    }
    setPlanModal(false);
  };
  const removePlan = (id) => setPlans((ps) => ps.filter((p) => p.id !== id));

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
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active === s.id ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
                  }`}
                >
                  <s.icon className="w-4.5 h-4.5" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {active === "profile" && (
              <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                <h3 className="font-semibold">Profile Information</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold">
                    AK
                  </div>
                  <div>
                    <button className="px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">
                      Change photo
                    </button>
                    <p className="text-xs text-black/40 mt-1.5">JPG or PNG. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full name">
                    <input className={inputCls} defaultValue="Alex Kovac" />
                  </Field>
                  <Field label="Email">
                    <input className={inputCls} defaultValue="alex@ironhub.com" />
                  </Field>
                  <Field label="Phone">
                    <input className={inputCls} defaultValue="+1 555 0100" />
                  </Field>
                  <Field label="Role">
                    <input className={inputCls} defaultValue="Super Admin" disabled />
                  </Field>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">
                    Cancel
                  </button>
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
                    Save changes
                  </button>
                </div>
              </div>
            )}

            {active === "gymProfile" && (
              <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                <h3 className="font-semibold">Gym Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Gym Name</label>
                    <input
                      className={inputCls}
                      value={gymProfile.name}
                      onChange={(e) => setGymProfile({ ...gymProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Address</label>
                    <input
                      className={inputCls}
                      value={gymProfile.address}
                      onChange={(e) => setGymProfile({ ...gymProfile, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Currency</label>
                    <select
                      className={inputCls}
                      value={gymProfile.currency}
                      onChange={(e) => setGymProfile({ ...gymProfile, currency: e.target.value })}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="SOS">SOS - Somali Shilling</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
                    Save profile
                  </button>
                </div>
              </div>
            )}

            {active === "plans" && (
              <div className="space-y-4">
                <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Membership Plans</h3>
                      <p className="text-xs text-black/50">Create and manage subscription packages</p>
                    </div>
                    <button
                      onClick={openAddPlan}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90"
                    >
                      <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add plan</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {plans.map((p) => (
                      <div key={p.id} className="group border border-black/10 rounded-xl p-4 hover:border-black/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-2xl font-bold mt-1">
                              ${p.price}<span className="text-xs font-normal text-black/40">/mo</span>
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditPlan(p)} className="p-1.5 rounded-lg hover:bg-black/5">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => removePlan(p.id)} className="p-1.5 rounded-lg hover:bg-black/5">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-black/50 mt-2">{p.features}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {active === "gyms" && (
              <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                <h3 className="font-semibold">Default Gym Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Default currency">
                    <select className={inputCls}>
                      <option>USD - US Dollar</option>
                      <option>EUR - Euro</option>
                      <option>GBP - British Pound</option>
                    </select>
                  </Field>
                  <Field label="Time zone">
                    <select className={inputCls}>
                      <option>UTC</option>
                      <option>America/New_York</option>
                      <option>Europe/London</option>
                    </select>
                  </Field>
                  <Field label="Operating hours start">
                    <input className={inputCls} defaultValue="05:00" />
                  </Field>
                  <Field label="Operating hours end">
                    <input className={inputCls} defaultValue="23:00" />
                  </Field>
                </div>
                <div className="flex justify-end pt-2">
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
                    Save changes
                  </button>
                </div>
              </div>
            )}

            {active === "notifications" && (
              <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-1">
                <h3 className="font-semibold mb-4">Notification Preferences</h3>
                {[
                  { key: "newMembers", label: "New member sign-ups", desc: "Get notified when a member joins" },
                  { key: "payments", label: "Payment alerts", desc: "Failed or successful payments" },
                  { key: "lowAttendance", label: "Low attendance warnings", desc: "When a gym drops below 60% capacity" },
                  { key: "reports", label: "Weekly reports", desc: "Summary of all gyms every Monday" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                    <div className="pr-4">
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs text-black/50">{n.desc}</p>
                    </div>
                    <Toggle on={notif[n.key]} onClick={() => setNotif({ ...notif, [n.key]: !notif[n.key] })} />
                  </div>
                ))}
              </div>
            )}

            {active === "security" && (
              <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                <h3 className="font-semibold">Security</h3>
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <p className="text-sm font-medium">Two-factor authentication</p>
                    <p className="text-xs text-black/50">Extra security for your account</p>
                  </div>
                  <Toggle on={twoFA} onClick={() => setTwoFA(!twoFA)} />
                </div>
                <div className="pt-2 space-y-4">
                  <Field label="Current password">
                    <input type="password" className={inputCls} defaultValue="password" />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="New password">
                      <input type="password" className={inputCls} />
                    </Field>
                    <Field label="Confirm new password">
                      <input type="password" className={inputCls} />
                    </Field>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
                    Update password
                  </button>
                </div>
              </div>
            )}

            {active === "billing" && (
              <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                <h3 className="font-semibold">Billing Plan</h3>
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/5">
                  <div>
                    <p className="font-semibold">Enterprise</p>
                    <p className="text-sm text-black/50">$299/month · 12 gyms</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-black text-white">
                    <Check className="w-3 h-3" /> Active
                  </span>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Payment method</p>
                  <div className="flex items-center justify-between p-4 border border-black/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-7 rounded bg-black flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">•••• 4242</p>
                        <p className="text-xs text-black/50">Expires 08/27</p>
                      </div>
                    </div>
                    <button className="text-sm font-medium hover:underline">Edit</button>
                  </div>
                </div>
              </div>
            )}

            {active === "regional" && (
              <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-5">
                <h3 className="font-semibold">Regional Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Language">
                    <select className={inputCls}>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Arabic</option>
                    </select>
                  </Field>
                  <Field label="Date format">
                    <select className={inputCls}>
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </Field>
                  <Field label="Distance unit">
                    <select className={inputCls}>
                      <option>Kilometers</option>
                      <option>Miles</option>
                    </select>
                  </Field>
                  <Field label="Weight unit">
                    <select className={inputCls}>
                      <option>Kilograms</option>
                      <option>Pounds</option>
                    </select>
                  </Field>
                </div>
                <div className="flex justify-end pt-2">
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
                    Save changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {planModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPlanModal(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 h-14 border-b border-black/10 shrink-0">
              <h3 className="font-semibold">{editingPlan ? "Edit Plan" : "Add Plan"}</h3>
              <button onClick={() => setPlanModal(false)} className="p-1.5 rounded-lg hover:bg-black/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1.5">Plan Name</label>
                <input
                  className={inputCls}
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Premium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Price ($/month)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Features</label>
                <input
                  className={inputCls}
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="Gym access · Sauna · PT"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-black/10 shrink-0">
              <button onClick={() => setPlanModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">
                Cancel
              </button>
              <button onClick={submitPlan} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
                {editingPlan ? "Save" : "Add plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}