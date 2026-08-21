import React, { useState } from "react";
import Layout from "@/components/Layout";
import { User, Building2, Bell, Shield, CreditCard, Globe, Check } from "lucide-react";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "gyms", label: "Gym Settings", icon: Building2 },
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
    </Layout>
  );
}