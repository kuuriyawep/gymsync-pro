import React from "react";
import { Check, Sparkles, Star } from "lucide-react";

const features = [
  "Unlimited members & memberships",
  "Payment tracking & outstanding balances",
  "Attendance & streak management",
  "Staff access & role permissions",
  "Reports, analytics & exports",
  "Membership expiry reminders",
];

// Clearly demo/fictitious testimonials — no real companies or people
const reviews = [
  { name: "Gym Owner · California", text: "Member management finally feels organized. I stopped losing track of expirations." },
  { name: "Studio Manager · Texas", text: "Payments and balances are clear at a glance. Way less admin time every week." },
  { name: "Fitness Center · Florida", text: "I can see exactly how the gym is performing without digging through spreadsheets." },
];

export default function Paywall({ onContinue, onLater, onRestore }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mx-auto mb-3"><Sparkles className="w-6 h-6" /></div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">GymSync Pro</h1>
        <p className="text-sm text-black/50 mt-1">Everything you need to run your gym professionally.</p>
      </div>

      <div className="bg-black text-white rounded-2xl p-5 mb-4">
        <div className="flex items-baseline gap-1"><span className="text-3xl font-bold">$29</span><span className="text-white/60 text-sm">/month</span></div>
        <p className="text-xs text-white/60 mt-1">Billed monthly. Cancel anytime.</p>
      </div>

      <div className="space-y-2.5 mb-5">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></div>
            <p className="text-sm">{f}</p>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-center gap-1 mb-3">
          {Array.from({ length: 6 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-black text-black" />)}
          <span className="text-xs text-black/50 ml-1">Loved by gym owners</span>
        </div>
        <div className="space-y-2.5">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white border border-black/10 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3 h-3 fill-black text-black" />)}</div>
              <p className="text-xs text-black/70 leading-snug">"{r.text}"</p>
              <p className="text-[10px] text-black/40 mt-1">{r.name} · demo testimonial</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <button onClick={onContinue} className="w-full py-3 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90">Start with Pro</button>
        <button onClick={onLater} className="w-full py-3 text-sm font-medium rounded-xl border border-black/15 hover:bg-black/5">Maybe later</button>
        <button onClick={onRestore} className="w-full text-xs text-black/50 hover:text-black py-1">Restore purchase</button>
      </div>
    </div>
  );
}