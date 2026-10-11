import React from "react";
import { ComposedChart, Bar, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function LivePerformanceChart({ data, label }) {
  return <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
    <div className="mb-4"><h3 className="font-semibold">Revenue & Members</h3><p className="text-xs text-black/50">{label}</p></div>
    <div className="h-64 md:h-72 -ml-2"><ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Bar yAxisId="left" dataKey="revenue" name="Revenue ($)" fill="#000" radius={[6, 6, 0, 0]} barSize={20} />
        <Line yAxisId="right" type="monotone" dataKey="newMembers" name="New Members" stroke="#00000060" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="renewals" name="Renewals" stroke="#000" strokeWidth={2} strokeDasharray="4 4" dot={false} />
      </ComposedChart>
    </ResponsiveContainer></div>
  </div>;
}