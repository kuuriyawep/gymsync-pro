import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, DollarSign, RefreshCw, UserCog, Download } from "lucide-react";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import LiveStatCards from "@/components/dashboard/LiveStatCards";
import LivePerformanceChart from "@/components/dashboard/LivePerformanceChart";
import LiveExpiryActivity from "@/components/dashboard/LiveExpiryActivity";
import { useMembers, useGymAnalytics, useMembersLoaded } from "@/lib/memberStore";
import { buildLiveGymAnalytics } from "@/lib/liveGymAnalytics";

const ranges = [{ key: "7d", label: "Last 7 days" }, { key: "30d", label: "Last 30 days" }, { key: "6m", label: "Last 6 months" }, { key: "year", label: "This year" }];
const actions = [{ label: "Add Member", icon: UserPlus, to: "/members" }, { label: "Record Payment", icon: DollarSign, to: "/payments" }, { label: "Renew Membership", icon: RefreshCw, to: "/membership" }, { label: "Add Trainer", icon: UserCog, to: "/trainers" }];

export default function Dashboard() {
  const [range, setRange] = useState("6m");
  const members = useMembers();
  const source = useGymAnalytics();
  const loaded = useMembersLoaded();
  const data = useMemo(() => buildLiveGymAnalytics(members, source, range), [members, source, range]);
  if (!loaded) return <Layout><PageSkeleton /></Layout>;
  const rangeLabel = ranges.find((item) => item.key === range)?.label;
  return <Layout><div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Dashboard</h1><p className="text-sm text-muted-foreground mt-0.5">Overview of your real gym data</p></div><button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground"><Download className="w-4 h-4" /> Export</button></div>
    <LiveStatCards stats={data.stats} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{actions.map((action) => <Link key={action.label} to={action.to}><div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-foreground/30"><div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><action.icon className="w-5 h-5" /></div><span className="text-sm font-semibold">{action.label}</span></div></Link>)}</div>
    <div><div className="flex items-center gap-1.5 flex-wrap justify-end mb-3">{ranges.map((item) => <button key={item.key} onClick={() => setRange(item.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${range === item.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>{item.label}</button>)}</div><LivePerformanceChart data={data.series} label={rangeLabel} /></div>
    <LiveExpiryActivity expiry={data.expiry} activities={data.recentActivities} />
  </div></Layout>;
}