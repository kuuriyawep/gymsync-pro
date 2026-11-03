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

export default function Paywall({ answers = {}, onContinue, onLater, onRestore }) {
  const outcomes = answers.outcome || [];
  const benefitText = outcomes.length
    ? outcomes.slice(0, 2).map((x) => labels[x]).filter(Boolean).join(" and ")
    : "less admin work and better visibility";

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3"><Sparkles className="w-6 h-6" /></div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">GymSync Pro</h1>
        <p className="text-sm text-muted-foreground mt-1">Run your gym with less admin.</p>
      </div>

      <div className="bg-primary text-primary-foreground rounded-2xl p-5 mb-4">
        <p className="text-sm text-primary-foreground/70 mb-1">Based on your setup</p>
        <p className="text-base font-semibold leading-snug">GymSync is built to give you {benefitText}.</p>
      </div>

      <div className="space-y-2.5 mb-5">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></div>
            <p className="text-sm">{f}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pro plan</p>
        <div className="flex items-baseline gap-1 mt-1"><span className="text-3xl font-bold">$29</span><span className="text-muted-foreground text-sm">/month</span></div>
        <p className="text-xs text-muted-foreground mt-1">30-day Pro trial. No card required to start. Billing will be connected securely before paid renewal.</p>
      </div>

      <div className="space-y-2 mt-auto">
        <button onClick={onContinue} className="w-full py-3 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">Start 30-day Pro trial</button>
        <button onClick={onLater} className="w-full py-3 text-sm font-medium rounded-xl border border-border hover:bg-accent">Continue with Free</button>
        <button onClick={onRestore} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">Restore purchase</button>
      </div>
    </div>
  );
}