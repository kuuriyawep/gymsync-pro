import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Users, DollarSign, Activity, TrendingUp, ChevronDown, Download } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";

const rangeOptions = [
  { key: "week", label: "Last week" },
  { key: "3m", label: "Last 3 months" },
  { key: "6m", label: "Last 6 months" },
  { key: "year", label: "Last year" },
];

const rangeData = {
  week: [
    { month: "Mon", revenue: 9, members: 1380 },
    { month: "Tue", revenue: 11, members: 1410 },
    { month: "Wed", revenue: 10, members: 1395 },
    { month: "Thu", revenue: 12, members: 1430 },
    { month: "Fri", revenue: 14, members: 1460 },
    { month: "Sat", revenue: 16, members: 1490 },
    { month: "Sun", revenue: 7, members: 1340 },
  ],
  "3m": [
    { month: "May", revenue: 42, members: 4400 },
    { month: "Jun", revenue: 45, members: 4600 },
    { month: "Jul", revenue: 48, members: 4829 },
  ],
  "6m": [
    { month: "Feb", revenue: 35, members: 3950 },
    { month: "Mar", revenue: 38, members: 4100 },
    { month: "Apr", revenue: 36, members: 4200 },
    { month: "May", revenue: 42, members: 4400 },
    { month: "Jun", revenue: 45, members: 4600 },
    { month: "Jul", revenue: 48, members: 4829 },
  ],
  year: [
    { month: "Aug", revenue: 30, members: 3600 },
    { month: "Sep", revenue: 31, members: 3700 },
    { month: "Oct", revenue: 33, members: 3850 },
    { month: "Nov", revenue: 34, members: 3900 },
    { month: "Dec", revenue: 32, members: 3850 },
    { month: "Jan", revenue: 35, members: 3950 },
    { month: "Feb", revenue: 35, members: 3950 },
    { month: "Mar", revenue: 38, members: 4100 },
    { month: "Apr", revenue: 36, members: 4200 },
    { month: "May", revenue: 42, members: 4400 },
    { month: "Jun", revenue: 45, members: 4600 },
    { month: "Jul", revenue: 48, members: 4829 },
  ],
};

const attendanceData = [
  { day: "Mon", count: 320 },
  { day: "Tue", count: 410 },
  { day: "Wed", count: 380 },
  { day: "Thu", count: 450 },
  { day: "Fri", count: 520 },
  { day: "Sat", count: 610 },
  { day: "Sun", count: 240 },
];

const tierData = [
  { name: "Standard", count: 4 },
  { name: "VIP", count: 3 },
];

const membershipGrowth = [
  { month: "Feb", active: 3950 },
  { month: "Mar", active: 4100 },
  { month: "Apr", active: 4200 },
  { month: "May", active: 4400 },
  { month: "Jun", active: 4600 },
  { month: "Jul", active: 4829 },
];

const stats = [
  { label: "Total Members", value: "4,829", change: "+12.5%", icon: Users },
  { label: "Active Members", value: "4,512", change: "+9.1%", icon: Activity },
  { label: "Monthly Revenue", value: "$48,250", change: "+8.2%", icon: DollarSign },
  { label: "Avg Daily Attendance", value: "418", change: "+5.4%", icon: TrendingUp },
];

const TIER_COLORS = ["#000", "#00000055"];

export default function Reports() {
  const [range, setRange] = useState("6m");
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeLabel = rangeOptions.find((o) => o.key === range)?.label ?? "Last 6 months";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-black/50 mt-0.5">Insights into your gym's performance</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Download className="w-4 h-4" /> Export report
          </button>
        </div>

        {/* Range selector */}
        <div className="relative inline-block">
          <button
            onClick={() => setRangeOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-black/5"
          >
            {rangeLabel}
            <ChevronDown className="w-4 h-4 text-black/50" />
          </button>
          {rangeOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
              <div className="absolute left-0 top-11 z-20 bg-white border border-black/10 rounded-lg shadow-lg w-40 py-1">
                {rangeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setRange(opt.key);
                      setRangeOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-sm hover:bg-black/5 text-left ${
                      range === opt.key ? "font-semibold" : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              className="bg-white border border-black/10 rounded-xl p-4 md:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center">
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-black">
                  <TrendingUp className="w-3 h-3" />
                  {s.change}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs text-black/50 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue & Member growth */}
          <div className="lg:col-span-2 bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="mb-4">
              <h3 className="font-semibold">Revenue & Member Growth</h3>
              <p className="text-xs text-black/50">{rangeLabel}</p>
            </div>
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rangeData[range]} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} cursor={{ stroke: "#00000020" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="members" stroke="#00000040" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tier distribution */}
          <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="mb-4">
              <h3 className="font-semibold">Tier Distribution</h3>
              <p className="text-xs text-black/50">Members by plan</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {tierData.map((_, i) => (
                      <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              {tierData.map((t, i) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: TIER_COLORS[i] }} />
                  <span className="text-xs text-black/60">{t.name} · {t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly attendance */}
          <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="mb-4">
              <h3 className="font-semibold">Weekly Attendance</h3>
              <p className="text-xs text-black/50">Check-ins per day</p>
            </div>
            <div className="h-56 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} cursor={{ fill: "#00000008" }} />
                  <Bar dataKey="count" fill="#000" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Membership growth */}
          <div className="lg:col-span-2 bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="mb-4">
              <h3 className="font-semibold">Membership Growth</h3>
              <p className="text-xs text-black/50">Active members over time</p>
            </div>
            <div className="h-56 -ml-2">
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
        </div>
      </div>
    </Layout>
  );
}