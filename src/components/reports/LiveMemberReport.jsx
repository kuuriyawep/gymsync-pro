import React from "react";
import { Users, UserCheck, RefreshCw, UserX } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { card, sectionLabel } from "@/lib/uiClasses";

const cards = [["total", "Total Members", Users], ["active", "Active Members", UserCheck], ["newMembers", "New This Month", RefreshCw], ["expired", "Expired Members", UserX]];

export default function LiveMemberReport({ data }) {
  return <section className="space-y-4"><h2 className={sectionLabel}>Members</h2>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([key, label, Icon]) => <div key={key} className={`${card} p-4`}><span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><Icon className="w-4 h-4" /></span><p className="text-xl font-bold tabular-nums">{data.members[key]}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>
    <div className={`${card} p-4 sm:p-5`}><h3 className="font-heading font-semibold">New Members Over Time</h3><p className="mb-4 text-xs text-muted-foreground">Registrations from your real member records</p><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.series}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} width={40} /><Tooltip contentStyle={{ background: "#121212", border: "1px solid #1e1e1e", borderRadius: 12, fontSize: 12, color: "#fff" }} labelStyle={{ color: "#888888" }} /><Line type="monotone" dataKey="newMembers" name="New Members" stroke="#34d399" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div></div>
  </section>;
}