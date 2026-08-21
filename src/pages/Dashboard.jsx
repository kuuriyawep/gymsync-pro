import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Users, DollarSign, Building2, Dumbbell, TrendingUp, TrendingDown, ArrowUpRight, ChevronDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const stats = [
  { label: "Total Members", value: "4,829", change: "+12.5%", up: true, icon: Users },
  { label: "Monthly Revenue", value: "$48,250", change: "+8.2%", up: true, icon: DollarSign },
  { label: "Active Gyms", value: "12", change: "+2", up: true, icon: Building2 },
  { label: "Active Trainers", value: "86", change: "-3", up: false, icon: Dumbbell },
];

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

const gyms = [
  { name: "Downtown Iron", members: 820, revenue: "$9,200", status: "Active" },
  { name: "Westside Fitness", members: 640, revenue: "$7,100", status: "Active" },
  { name: "Riverside Gym", members: 510, revenue: "$5,600", status: "Active" },
  { name: "Northgate Athletic", members: 430, revenue: "$4,800", status: "Maintenance" },
];

const recentMembers = [
  { name: "Sarah Chen", gym: "Downtown Iron", plan: "Premium", date: "2h ago" },
  { name: "Marcus Reed", gym: "Westside Fitness", plan: "Basic", date: "5h ago" },
  { name: "Lena Park", gym: "Riverside Gym", plan: "Premium", date: "1d ago" },
  { name: "Diego Santos", gym: "Downtown Iron", plan: "Standard", date: "2d ago" },
];

export default function Dashboard() {
  const [range, setRange] = useState("6m");
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeLabel = rangeOptions.find((o) => o.key === range)?.label ?? "Last 6 months";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-black/50 mt-0.5">Overview across all your gym locations</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">
              Last 30 days
            </button>
            <button className="px-3 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
              Export
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center">
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold ${
                    s.up ? "text-black" : "text-black/50"
                  }`}
                >
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.change}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs text-black/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Revenue & Members</h3>
                <p className="text-xs text-black/50">{rangeLabel}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setRangeOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-sm font-medium hover:bg-black/5"
                >
                  {rangeLabel}
                  <ChevronDown className="w-4 h-4 text-black/50" />
                </button>
                {rangeOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                    <div className="absolute right-0 top-9 z-20 bg-white border border-black/10 rounded-lg shadow-lg w-40 py-1">
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
            </div>
            <div className="h-56 md:h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rangeData[range]} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }}
                    cursor={{ stroke: "#00000020" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="members" stroke="#00000040" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="mb-4">
              <h3 className="font-semibold">Weekly Attendance</h3>
              <p className="text-xs text-black/50">Check-ins per day</p>
            </div>
            <div className="h-56 md:h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }}
                    cursor={{ fill: "#00000008" }}
                  />
                  <Bar dataKey="count" fill="#000" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent members */}
        <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">New Members</h3>
            <button className="text-xs font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentMembers.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-black/50 truncate">{m.gym} · {m.plan}</p>
                </div>
                <span className="text-xs text-black/40 whitespace-nowrap">{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}