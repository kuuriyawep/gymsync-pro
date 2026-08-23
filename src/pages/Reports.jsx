import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Users, UserCheck, UserX, RefreshCw, DollarSign, Download, Activity, Dumbbell, Award, Percent } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { revenueBreakdown, memberSummary, membershipStats, expirationTrends, planPerformance, trainers } from "@/lib/mockData";

const rangeOptions = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "6m", label: "Last 6 months" },
  { key: "year", label: "This year" },
];

const rangeData = {
  "7d": [
    { month: "Mon", revenue: 1.8 }, { month: "Tue", revenue: 2.1 }, { month: "Wed", revenue: 1.9 },
    { month: "Thu", revenue: 2.4 }, { month: "Fri", revenue: 2.8 }, { month: "Sat", revenue: 3.2 }, { month: "Sun", revenue: 1.4 },
  ],
  "30d": [
    { month: "Wk 1", revenue: 12.5 }, { month: "Wk 2", revenue: 14.2 }, { month: "Wk 3", revenue: 13.8 }, { month: "Wk 4", revenue: 15.6 },
  ],
  "6m": [
    { month: "Feb", revenue: 35 }, { month: "Mar", revenue: 38 }, { month: "Apr", revenue: 36 },
    { month: "May", revenue: 42 }, { month: "Jun", revenue: 45 }, { month: "Jul", revenue: 48 },
  ],
  year: [
    { month: "Aug", revenue: 30 }, { month: "Sep", revenue: 31 }, { month: "Oct", revenue: 33 }, { month: "Nov", revenue: 34 },
    { month: "Dec", revenue: 32 }, { month: "Jan", revenue: 35 }, { month: "Feb", revenue: 35 }, { month: "Mar", revenue: 38 },
    { month: "Apr", revenue: 36 }, { month: "May", revenue: 42 }, { month: "Jun", revenue: 45 }, { month: "Jul", revenue: 48 },
  ],
};

const membershipGrowth = [
  { month: "Feb", active: 3950 }, { month: "Mar", active: 4100 }, { month: "Apr", active: 4200 },
  { month: "May", active: 4400 }, { month: "Jun", active: 4600 }, { month: "Jul", active: 4829 },
];

const DONUT_COLORS = ["#000", "#00000066", "#00000033", "#0000001a"];
const SectionTitle = ({ children }) => <h2 className="text-xs font-semibold uppercase tracking-wider text-black/40">{children}</h2>;

export default function Reports() {
  const [range, setRange] = useState("6m");
  const rangeLabel = rangeOptions.find((o) => o.key === range)?.label ?? "Last 6 months";

  const revenueCards = [
    { label: "Daily", value: `$${revenueBreakdown.daily.toLocaleString()}` },
    { label: "Weekly", value: `$${revenueBreakdown.weekly.toLocaleString()}` },
    { label: "Monthly", value: `$${revenueBreakdown.monthly.toLocaleString()}` },
    { label: "Quarterly", value: `$${revenueBreakdown.quarterly.toLocaleString()}` },
    { label: "Yearly", value: `$${revenueBreakdown.yearly.toLocaleString()}` },
  ];
  const memberCards = [
    { label: "New Members", value: memberSummary.newMembers, icon: Users },
    { label: "Active Members", value: memberSummary.active, icon: UserCheck },
    { label: "Expired Members", value: memberSummary.expired, icon: UserX },
    { label: "Renewals", value: memberSummary.renewals, icon: RefreshCw },
  ];
  const trainerCards = [
    { label: "Total Trainers", value: trainers.length, icon: Dumbbell },
    { label: "Active Trainers", value: trainers.filter((t) => t.status === "Active").length, icon: UserCheck },
    { label: "Avg Members/Trainer", value: Math.round(trainers.reduce((s, t) => s + t.assigned, 0) / trainers.length), icon: Activity },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-black/50 mt-0.5">Detailed insights into your gym's performance</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Download className="w-4 h-4" /> Export report
          </button>
        </div>

        {/* Range filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {rangeOptions.map((o) => (
            <button key={o.key} onClick={() => setRange(o.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${range === o.key ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{o.label}</button>
          ))}
        </div>

        {/* REVENUE */}
        <section className="space-y-4">
          <SectionTitle>Revenue</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {revenueCards.map((c) => (
              <div key={c.label} className="bg-white border border-black/10 rounded-xl p-4">
                <p className="text-lg md:text-xl font-bold">{c.value}</p>
                <p className="text-xs text-black/50 mt-0.5">{c.label} Revenue</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="mb-4"><h3 className="font-semibold">Revenue Trend</h3><p className="text-xs text-black/50">{rangeLabel}</p></div>
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rangeData[range]} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} cursor={{ stroke: "#00000020" }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue ($K)" stroke="#000" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* MEMBERS */}
        <section className="space-y-4">
          <SectionTitle>Members</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {memberCards.map((c) => (
              <div key={c.label} className="bg-white border border-black/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center"><c.icon className="w-4 h-4" /></div></div>
                <p className="text-xl font-bold">{c.value.toLocaleString()}</p><p className="text-xs text-black/50">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="mb-4"><h3 className="font-semibold">Member Growth</h3><p className="text-xs text-black/50">Active members over time</p></div>
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={membershipGrowth} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} cursor={{ stroke: "#00000020" }} />
                  <Line type="monotone" dataKey="active" name="Active Members" stroke="#000" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* MEMBERSHIP */}
        <section className="space-y-4">
          <SectionTitle>Membership</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-black/10 rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-black text-white flex items-center justify-center"><Award className="w-6 h-6" /></div>
              <div><p className="text-xs text-black/40">Most Popular Plan</p><p className="text-lg font-bold">{membershipStats.mostPopularPlan}</p></div>
            </div>
            <div className="bg-white border border-black/10 rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-black text-white flex items-center justify-center"><Percent className="w-6 h-6" /></div>
              <div><p className="text-xs text-black/40">Renewal Rate</p><p className="text-lg font-bold">{membershipStats.renewalRate}%</p></div>
            </div>
            <div className="bg-white border border-black/10 rounded-xl p-5">
              <div className="mb-2"><h3 className="font-semibold text-sm">Plan Distribution</h3></div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planPerformance} dataKey="members" nameKey="plan" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={2}>
                      {planPerformance.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
              <div className="mb-4"><h3 className="font-semibold">Expiration Trends</h3><p className="text-xs text-black/50">Expired memberships per month</p></div>
              <div className="h-56 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expirationTrends} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} cursor={{ fill: "#00000008" }} />
                    <Bar dataKey="expired" fill="#000" radius={[6, 6, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
              <div className="mb-4"><h3 className="font-semibold">Plan Performance</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-black/10 text-left text-xs text-black/40">
                    <th className="py-2 pr-3 font-medium">Plan</th><th className="py-2 pr-3 font-medium">Members</th><th className="py-2 pr-3 font-medium">Revenue</th><th className="py-2 font-medium">Share</th>
                  </tr></thead>
                  <tbody>
                    {planPerformance.map((p) => (
                      <tr key={p.plan} className="border-b border-black/5 last:border-0">
                        <td className="py-2.5 pr-3 font-medium">{p.plan}</td>
                        <td className="py-2.5 pr-3 tabular-nums">{p.members}</td>
                        <td className="py-2.5 pr-3 tabular-nums">${p.revenue.toLocaleString()}</td>
                        <td className="py-2.5 tabular-nums">{p.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* TRAINERS */}
        <section className="space-y-4">
          <SectionTitle>Trainers</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {trainerCards.map((c) => (
              <div key={c.label} className="bg-white border border-black/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center"><c.icon className="w-4 h-4" /></div></div>
                <p className="text-xl font-bold">{c.value}</p><p className="text-xs text-black/50">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="mb-4"><h3 className="font-semibold">Members per Trainer</h3></div>
            <div className="h-56 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trainers.map((t) => ({ name: t.name, members: t.assigned }))} margin={{ top: 5, right: 10, bottom: 0, left: -10 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} cursor={{ fill: "#00000008" }} />
                  <Bar dataKey="members" fill="#000" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}