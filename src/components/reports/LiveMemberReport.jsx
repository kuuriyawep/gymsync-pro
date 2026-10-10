import React from "react";
import { Users, UserCheck, RefreshCw, UserX } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
/** @type {Array<[string, string, React.ComponentType<{ className?: string }>]>} */
const cards = [["total", "Total Members", Users], ["active", "Active Members", UserCheck], ["newMembers", "New This Month", RefreshCw], ["expired", "Expired Members", UserX]];
export default function LiveMemberReport({ data }) {
  return <section className="space-y-4"><h2 className="text-xs font-semibold uppercase tracking-wider text-black/40">Members</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cards.map(([key, label, Icon]) => <div key={key} className="bg-white border border-black/10 rounded-xl p-4"><div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center mb-2"><Icon className="w-4 h-4" /></div><p className="text-xl font-bold">{data.members[key]}</p><p className="text-xs text-black/50">{label}</p></div>)}</div>
    <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5"><h3 className="font-semibold">New Members Over Time</h3><p className="text-xs text-black/50 mb-4">Registrations from your real member records</p><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.series}><CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="newMembers" name="New Members" stroke="#000" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div></div>
  </section>;
}