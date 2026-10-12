import React from "react";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { card, sectionLabel } from "@/lib/uiClasses";

const colors = ["#34d399", "#a3e635", "#fbbf24"];
const tooltip = { background: "#121212", border: "1px solid #1e1e1e", borderRadius: 12, fontSize: 12, color: "#fff" };

export default function LiveRevenueReport({ data, label }) {
  const cards = Object.entries(data.revenue);
  return <section className="space-y-4"><h2 className={sectionLabel}>Revenue</h2>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{cards.map(([name, value]) => <div key={name} className={`${card} p-4`}><p className="text-lg font-bold tabular-nums md:text-xl">${value.toLocaleString()}</p><p className="text-xs capitalize text-muted-foreground">{name} Revenue</p></div>)}</div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><div className={`${card} p-4 sm:p-5 lg:col-span-2`}><h3 className="font-heading font-semibold">Revenue Trend</h3><p className="mb-4 text-xs text-muted-foreground">{label}</p><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.series}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} width={48} /><Tooltip contentStyle={tooltip} labelStyle={{ color: "#888888" }} /><Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#34d399" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div></div>
      <div className={`${card} p-4 sm:p-5`}><h3 className="font-heading text-sm font-semibold">Members by Payment Status</h3><div className="mt-2 h-40"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.paymentStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={60} stroke="none">{data.paymentStatus.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Pie><Tooltip contentStyle={tooltip} /></PieChart></ResponsiveContainer></div>{data.paymentStatus.map((item, i) => <div key={item.name} className="flex justify-between py-1 text-xs"><span className="text-muted-foreground"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: colors[i] }} />{item.name}</span><b className="tabular-nums">{item.value}</b></div>)}</div>
    </div>
  </section>;
}