import React from "react";
import { Check, Sparkles } from "lucide-react";

const features = [
  "Unlimited members & memberships",
  "Payment tracking & outstanding balances",
  "Membership expiry reminders",
  "Staff access & role permissions",
  "Reports, analytics & exports",
  "Attendance and member experience tools",
];

const labels = {
  time: "less daily admin work",
  renewals: "fewer missed renewals",
  payments: "clearer payment tracking",
  performance: "better visibility into your gym",
  members: "simpler member management",
  staff: "better team control",
  engagement: "a stronger member experience",
};

/** @param {{ answers?: Record<string, any>; onContinue?: () => void; onLater?: () => void; onRestore?: () => void }} props */
export default function Paywall({ answers = {}, onContinue, onLater, onRestore }) {
  const outcomes = answers.outcome || [];
  const benefitText = outcomes.length
    ? outcomes.slice(0, 2).map((x) => labels[x]).filter(Boolean).join(" and ")
    : "less admin work and better visibility";

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mx-auto mb-3"><Sparkles className="w-6 h-6" /></div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">GymSync Pro</h1>
        <p className="text-sm text-black/50 mt-1">Run your gym with less admin.</p>
      </div>

      <div className="bg-black text-white rounded-2xl p-5 mb-4">
        <p className="text-sm text-white/70 mb-1">Based on your setup</p>
        <p className="text-base font-semibold leading-snug">GymSync is built to give you {benefitText}.</p>
      </div>

      <div className="space-y-2.5 mb-5">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></div>
            <p className="text-sm">{f}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-4 mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-black/40">Pro plan</p>
        <div className="flex items-baseline gap-1 mt-1"><span className="text-3xl font-bold">$29</span><span className="text-black/50 text-sm">/month</span></div>
        <p className="text-xs text-black/50 mt-1">30-day Pro trial. No card required to start. Billing will be connected securely before paid renewal.</p>
      </div>

      <div className="space-y-2 mt-auto">
        <button onClick={onContinue} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">Start 30-day Pro trial</button>
        <button onClick={onLater} className="w-full py-3 text-sm font-medium rounded-xl border border-black/15 hover:bg-black/5">Continue with Free</button>
        <button onClick={onRestore} className="w-full text-xs text-black/50 hover:text-black py-1">Restore purchase</button>
      </div>
    </div>
  );
}