import React from "react";
import Layout from "@/components/Layout";
import { Users, DollarSign, Building2, Dumbbell, TrendingUp, TrendingDown, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const stats = [
  { label: "Total Members", value: "4,829", change: "+12.5%", up: true, icon: Users },
  { label: "Monthly Revenue", value: "$48,250", change: "+8.2%", up: true, icon: DollarSign },
  { label: "Active Gyms", value: "12", change: "+2", up: true, icon: Building2 },
  { label: "Active Trainers", value: "86", change: "-3", up: false, icon: Dumbbell },
];

const revenueData = [
  { month: "Jan", revenue: 32, members: 3800 },
  { month: "Feb", revenue: 35, members: 3950 },
  { month: "Mar", revenue: 38, members: 4100 },
  { month: "Apr", revenue: 36, members: 4200 },
  { month: "May", revenue: 42, members: 4400 },
  { month: "Jun", revenue: 45, members: 4600 },
  { month: "Jul", revenue: 48, members: 4829 },
];

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
                <p className="text-xs text-black/50">Last 7 months</p>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-black/5">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="h-56 md:h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
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

        {/* Gyms + Recent members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Gym Locations</h3>
              <button className="text-xs font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-medium text-black/40 border-b border-black/5">
                <span>Location</span>
                <span className="text-right">Members</span>
                <span className="text-right">Revenue</span>
                <span className="text-right">Status</span>
              </div>
              {gyms.map((g) => (
                <div key={g.name} className="grid grid-cols-4 gap-2 px-3 py-3 items-center text-sm hover:bg-black/[0.02] rounded-lg">
                  <span className="font-medium truncate">{g.name}</span>
                  <span className="text-right tabular-nums">{g.members}</span>
                  <span className="text-right tabular-nums font-medium">{g.revenue}</span>
                  <span className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        g.status === "Active" ? "bg-black text-white" : "bg-black/10 text-black/60"
                      }`}
                    >
                      {g.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

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
      </div>
    </Layout>
  );
}