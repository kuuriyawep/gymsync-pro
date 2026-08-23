import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  Users, UserCheck, Clock, UserX, DollarSign, Dumbbell,
  UserPlus, RefreshCw, UserCog, CalendarCheck, AlarmClock,
  TrendingUp, TrendingDown, Download,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { analyticsData, dashboardStats, expiryOverview, activities } from "@/lib/mockData";

const statCards = [
  { key: "totalMembers", label: "Total Members", icon: Users, change: "+12.5%", up: true },
  { key: "activeMembers", label: "Active Members", icon: UserCheck, change: "+9.1%", up: true },
  { key: "expiringSoon", label: "Expiring Soon", icon: Clock, change: "+18", up: true },
  { key: "expired", label: "Expired Members", icon: UserX, change: "-4", up: false },
  { key: "monthlyRevenue", label: "Monthly Revenue", icon: DollarSign, change: "+8.2%", up: true },
  { key: "activeTrainers", label: "Active Trainers", icon: Dumbbell, change: "+2", up: true },
];

const quickActions = [
  { label: "Add Member", icon: UserPlus, to: "/members" },
  { label: "Record Payment", icon: DollarSign, to: "/payments" },
  { label: "Renew Membership", icon: RefreshCw, to: "/membership" },
  { label: "Add Trainer", icon: UserCog, to: null },
];

const rangeOptions = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "6m", label: "Last 6 months" },
  { key: "year", label: "This year" },
];

const expiryCards = [
  { key: "expired", label: "Expired", value: expiryOverview.expired, icon: UserX, tone: "expired" },
  { key: "today", label: "Expires Today", value: expiryOverview.today, icon: CalendarCheck, tone: "today" },
  { key: "threeDays", label: "Within 3 Days", value: expiryOverview.threeDays, icon: Clock, tone: "soon" },
  { key: "fiveDays", label: "Within 5 Days", value: expiryOverview.fiveDays, icon: AlarmClock, tone: "soon" },
];

const activityIcon = { member: UserPlus, payment: DollarSign, renewal: RefreshCw, trainer: UserCog };

export default function Dashboard() {
  const [range, setRange] = useState("6m");
  const rangeLabel = rangeOptions.find((o) => o.key === range)?.label ?? "Last 6 months";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-black/50 mt-0.5">Overview of your gym</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.25 }}
              className="bg-white border border-black/10 rounded-xl p-4 md:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center">
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${s.up ? "text-black" : "text-black/50"}`}>
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.change}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold tracking-tight">
                {s.key === "monthlyRevenue" ? `$${dashboardStats[s.key].toLocaleString()}` : dashboardStats[s.key].toLocaleString()}
              </p>
              <p className="text-xs text-black/50 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const content = (
              <div className="flex items-center gap-3 bg-white border border-black/10 rounded-xl p-4 hover:border-black/30 hover:bg-black/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center">
                  <a.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">{a.label}</span>
              </div>
            );
            return a.to ? (
              <Link key={a.label} to={a.to}>{content}</Link>
            ) : (
              <button key={a.label} type="button" className="text-left">{content}</button>
            );
          })}
        </div>

        {/* Analytics */}
        <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold">Revenue & Members</h3>
              <p className="text-xs text-black/50">{rangeLabel}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {rangeOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setRange(o.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    range === o.key ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 md:h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analyticsData[range]} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#00000080" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #00000020", fontSize: 12 }} cursor={{ fill: "#00000008" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue ($K)" fill="#000" radius={[6, 6, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="newMembers" name="New Members" stroke="#00000060" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="renewals" name="Renewals" stroke="#000" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expiry overview + Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <h3 className="font-semibold mb-4">Expiry Overview</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {expiryCards.map((e) => (
                <div key={e.key} className="border border-black/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${e.tone === "expired" ? "bg-black text-white" : "bg-black/5"}`}>
                      <e.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{e.value}</p>
                  <p className="text-xs text-black/50 mt-0.5">{e.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((a) => {
                const Icon = activityIcon[a.type];
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight">{a.text}</p>
                      <p className="text-xs text-black/40 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}