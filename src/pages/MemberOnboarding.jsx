import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, User, Phone, ShieldCheck, Camera, Loader2, PartyPopper } from "lucide-react";
import PhotoPicker from "@/components/PhotoPicker";
import { useMembers, setMembers } from "@/lib/memberStore";
import { useToast } from "@/components/ui/use-toast";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";

const steps = [
  { key: "personal", label: "Personal Info", icon: User },
  { key: "emergency", label: "Emergency Contact", icon: ShieldCheck },
  { key: "photo", label: "Profile Photo", icon: Camera },
];

const empty = {
  name: "", phone: "", email: "", dob: "", gender: "Prefer not to say",
  emergencyName: "", emergencyPhone: "", emergencyRelation: "",
  photoUrl: null,
};

export default function MemberOnboarding() {
  const navigate = useNavigate();
  const members = useMembers();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.name.trim()) e.name = "Full name is required";
      if (!form.phone.trim()) e.phone = "Phone number is required";
    }
    if (step === 1) {
      if (!form.emergencyName.trim()) e.emergencyName = "Emergency contact name is required";
      if (!form.emergencyPhone.trim()) e.emergencyPhone = "Emergency contact phone is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, steps.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    if (!validateStep()) return;
    setSaving(true);
    setTimeout(() => {
      const id = Math.max(...members.map((m) => m.id), 0) + 1;
      const today = new Date().toISOString().slice(0, 10);
      const expiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      setMembers((ms) => [{
        id, memberId: `GYM-${1000 + id}`, name: form.name, phone: form.phone, email: form.email,
        plan: "Monthly", fee: 60, status: "Active", startDate: today, expiryDate: expiry,
        paymentStatus: "Pending", paymentMethod: "Cash", registeredDate: today, gym: "Olympic Gym",
        preferredTime: "Flexible", note: "", photoUrl: form.photoUrl,
        dob: form.dob, gender: form.gender,
        emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone, relation: form.emergencyRelation },
      }, ...ms]);
      setSaving(false);
      setDone(true);
      toast({ title: "Profile complete", description: `${form.name} is ready to go` });
    }, 700);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-5">
            <PartyPopper className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">You're all set!</h1>
          <p className="text-sm text-black/50 mt-2">Your profile is complete. Welcome to Olympic Gym.</p>
          <div className="mt-6 flex flex-col gap-2">
            <button onClick={() => navigate("/members")} className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Go to Members</button>
            <button onClick={() => { setForm(empty); setStep(0); setDone(false); }} className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Onboard another member</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.02] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-lg bg-white border border-black/10 rounded-2xl shadow-sm overflow-hidden">
        {/* Header + stepper */}
        <div className="px-6 pt-6 pb-4 border-b border-black/10">
          <h1 className="text-xl font-heading font-bold tracking-tight">Member Onboarding</h1>
          <p className="text-xs text-black/50 mt-0.5">Complete your profile to finish setting up</p>
          <div className="flex items-center gap-2 mt-5">
            {steps.map((s, i) => {
              const active = i === step;
              const complete = i < step;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${complete ? "bg-black text-white" : active ? "bg-black text-white" : "bg-black/5 text-black/40"}`}>
                      {complete ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-medium ${active || complete ? "text-black" : "text-black/40"}`}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`h-0.5 flex-1 -mt-4 rounded-full ${i < step ? "bg-black" : "bg-black/10"}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
              {step === 0 && (
                <>
                  <div><label className={labelCls}>Full Name</label>
                    <input className={`${inputCls} ${errors.name ? "border-black bg-black/5" : ""}`} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" />
                    {errors.name && <p className="text-xs text-black font-medium mt-1">{errors.name}</p>}</div>
                  <div><label className={labelCls}>Phone Number</label>
                    <input className={`${inputCls} ${errors.phone ? "border-black bg-black/5" : ""}`} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 0100" />
                    {errors.phone && <p className="text-xs text-black font-medium mt-1">{errors.phone}</p>}</div>
                  <div><label className={labelCls}>Email (optional)</label>
                    <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@olympicgym.com" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Date of Birth</label>
                      <input type="date" className={inputCls} value={form.dob} onChange={(e) => set("dob", e.target.value)} /></div>
                    <div><label className={labelCls}>Gender</label>
                      <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                        {["Female", "Male", "Non-binary", "Prefer not to say"].map((o) => <option key={o}>{o}</option>)}
                      </select></div>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="text-sm text-black/50 -mt-1">In case of an emergency, who should we contact?</p>
                  <div><label className={labelCls}>Contact Name</label>
                    <input className={`${inputCls} ${errors.emergencyName ? "border-black bg-black/5" : ""}`} value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} placeholder="John Doe" />
                    {errors.emergencyName && <p className="text-xs text-black font-medium mt-1">{errors.emergencyName}</p>}</div>
                  <div><label className={labelCls}>Contact Phone</label>
                    <input className={`${inputCls} ${errors.emergencyPhone ? "border-black bg-black/5" : ""}`} value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} placeholder="+1 555 0199" />
                    {errors.emergencyPhone && <p className="text-xs text-black font-medium mt-1">{errors.emergencyPhone}</p>}</div>
                  <div><label className={labelCls}>Relationship</label>
                    <select className={inputCls} value={form.emergencyRelation} onChange={(e) => set("emergencyRelation", e.target.value)}>
                      {["", "Spouse", "Parent", "Sibling", "Child", "Friend", "Other"].map((o) => <option key={o || "none"} value={o}>{o || "Select…"}</option>)}
                    </select></div>
                </>
              )}
              {step === 2 && (
                <>
                  <p className="text-sm text-black/50 -mt-1">Add a photo so staff can recognize you at check-in.</p>
                  <div className="flex flex-col items-center gap-3 py-2">
                    <PhotoPicker value={form.photoUrl} onChange={(url) => set("photoUrl", url)} onRemove={() => set("photoUrl", null)} size="w-20 h-20" placeholder={form.name ? form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : null} hint="JPG or PNG. You can skip this step." />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/10 bg-black/[0.02]">
          <button onClick={back} disabled={step === 0} className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-white disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={next} className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90 disabled:opacity-80">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Complete profile</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}