import React, { useState } from "react";
import { Users, BarChart3, TrendingUp } from "lucide-react";

function MembersReport() {
  const growth = [40, 52, 61, 70, 88, 96, 110];
  const max = 110;
  const rows = [["Sarah Chen", "Monthly", "Active"], ["Marcus Reed", "Quarterly", "Active"], ["Lena Park", "Monthly", "Expiring"], ["Diego Santos", "Annual", "Active"]];
  const badge = (s) => (s === "Active" ? "bg-emerald-600 text-white" : "bg-black/10 text-black");
  return (
    <div className="space-y-3">
      <div className="bg-white border border-black/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold">Member growth</p>
          <span className="flex items-center gap-1 text-[10px] text-black/50"><TrendingUp className="w-3 h-3" /> +18% this month</span>
        </div>
        <div className="flex items-end justify-between gap-1.5 h-24">
          {growth.map((g, i) => (
            <div key={i} className="flex-1 bg-black rounded-t-sm" style={{ height: `${(g / max) * 100}%` }} />
          ))}
        </div>
      </div>
      <div className="bg-white border border-black/10 rounded-xl divide-y divide-black/5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-[9px] font-semibold">{r[0].split(" ").map((n) => n[0]).join("")}</div>
              <div><p className="text-sm font-medium">{r[0]}</p><p className="text-[10px] text-black/50">{r[1]}</p></div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge(r[2])}`}>{r[2]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueReport() {
  const bars = [2.1, 2.4, 1.9, 2.8, 3.2, 2.6, 3.4];
  const max = 3.4;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[["Revenue", "$48K"], ["Collected", "$45K"], ["Outstanding", "$3K"]].map(([l, v]) => (
          <div key={l} className="bg-white border border-black/10 rounded-xl p-3"><p className="text-base font-bold">{v}</p><p className="text-[10px] text-black/50">{l}</p></div>
        ))}
      </div>
      <div className="bg-white border border-black/10 rounded-xl p-4">
        <p className="text-xs font-semibold mb-3">Revenue this week</p>
        <div className="flex items-end justify-between gap-2 h-24">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-black rounded-t-md" style={{ height: `${(b / max) * 100}%` }} />
              <span className="text-[9px] text-black/40">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-black/10 rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs text-black/50">Collection rate</span>
        <span className="text-sm font-semibold">94%</span>
      </div>
    </div>
  );
}

export default function ReportPreview() {
  const [tab, setTab] = useState("members");
  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-black/5 rounded-xl">
        <button onClick={() => setTab("members")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === "members" ? "bg-black text-white" : "text-black/60"}`}><Users className="w-3.5 h-3.5" />Members</button>
        <button onClick={() => setTab("revenue")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === "revenue" ? "bg-black text-white" : "text-black/60"}`}><BarChart3 className="w-3.5 h-3.5" />Revenue</button>
      </div>
      {tab === "members" ? <MembersReport /> : <RevenueReport />}
      <p className="text-[11px] text-black/40 text-center">A preview of the reports you'll get with GymSync.</p>
    </div>
  );
}