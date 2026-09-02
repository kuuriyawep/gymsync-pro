import React from "react";
import { Flame, MessageSquare, Dumbbell, UserCog, Bell, Check } from "lucide-react";

// Member streak concept: 7 → 8 → 9 days + calendar dots
export function StreakVisual() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-5 text-center">
        <Flame className="w-8 h-8 mx-auto mb-2" />
        <p className="text-3xl font-bold">9 day streak</p>
        <p className="text-sm text-white/60 mt-1">Show up consistently. Keep it alive.</p>
      </div>
      <div className="flex items-center justify-center gap-3">
        {[7, 8, 9].map((d, i) => (
          <div key={d} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${d < 9 ? "bg-black text-white" : "bg-black/5 text-black border border-black/15"}`}>{d}</div>
              <span className="text-[10px] text-black/40">days</span>
            </div>
            {i < 2 && <div className="w-6 h-px bg-black/15" />}
          </div>
        ))}
      </div>
      <div className="bg-white border border-black/10 rounded-xl p-4">
        <p className="text-xs font-semibold mb-3">This month</p>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className={`aspect-square rounded-md flex items-center justify-center ${i % 7 < 5 ? "bg-black text-white" : "bg-black/5 text-black/30"}`}>
              {i % 7 < 5 && <Check className="w-3 h-3" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Member membership + balance card
export function MembershipCardVisual() {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div><p className="text-xs text-black/50">Membership</p><p className="text-lg font-bold">Monthly</p></div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black text-white">Active</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><p className="text-xs text-black/50">Start</p><p className="text-sm font-semibold">Aug 1, 2026</p></div>
          <div><p className="text-xs text-black/50">Expiry</p><p className="text-sm font-semibold">Sep 1, 2026</p></div>
        </div>
        <div className="flex justify-between text-xs mb-1.5"><span className="text-black/50">12 days remaining</span><span className="text-black/50">60% used</span></div>
        <div className="h-2 rounded-full bg-black/5 overflow-hidden"><div className="h-full bg-black rounded-full" style={{ width: "60%" }} /></div>
      </div>
      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Payments</h3><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black text-white">Paid</span></div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Price", "$60"], ["Paid", "$60"], ["Balance", "$0"]].map(([l, v]) => (
            <div key={l} className="bg-black/[0.02] rounded-xl p-3"><p className="text-xs text-black/50">{l}</p><p className="text-base font-bold">{v}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Member communication channels
export function ConnectedVisual() {
  const items = [
    { Icon: MessageSquare, label: "Feedback", desc: "Share how your gym is doing" },
    { Icon: Dumbbell, label: "Machine request", desc: "Ask for new equipment" },
    { Icon: UserCog, label: "Coach request", desc: "Request a personal coach" },
    { Icon: Bell, label: "Notifications", desc: "Stay updated by your gym" },
  ];
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label} className="bg-white border border-black/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center"><it.Icon className="w-5 h-5" /></div>
          <div><p className="text-sm font-semibold">{it.label}</p><p className="text-xs text-black/50">{it.desc}</p></div>
        </div>
      ))}
    </div>
  );
}

// Mini Member Dashboard preview in the existing design language
export function MemberDashboardPreview() {
  return (
    <div className="space-y-3">
      <div><p className="text-sm text-black/50">Good morning,</p><h2 className="text-xl font-heading font-bold">Sarah Chen</h2></div>
      <div className="bg-white border border-black/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2"><p className="text-xs text-black/50">Membership</p><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black text-white">Active</span></div>
        <p className="text-base font-bold">Monthly</p>
        <div className="h-2 rounded-full bg-black/5 mt-3 overflow-hidden"><div className="h-full bg-black rounded-full" style={{ width: "60%" }} /></div>
        <p className="text-[10px] text-black/50 mt-1">12 days remaining</p>
      </div>
      <div className="bg-black text-white rounded-2xl p-4 text-center">
        <Flame className="w-6 h-6 mx-auto mb-1" />
        <p className="text-lg font-bold">9 day streak</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Price", "$60"], ["Paid", "$60"], ["Balance", "$0"]].map(([l, v]) => (
          <div key={l} className="bg-white border border-black/10 rounded-xl p-3 text-center"><p className="text-sm font-bold">{v}</p><p className="text-[10px] text-black/50">{l}</p></div>
        ))}
      </div>
    </div>
  );
}