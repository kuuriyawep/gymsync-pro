import React, { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import LivePerformanceChart from "@/components/dashboard/LivePerformanceChart";
import RevenueHeroCard from "@/components/dashboard/RevenueHeroCard";
import DashboardKpiCards from "@/components/dashboard/DashboardKpiCards";
import RecentPayments from "@/components/dashboard/RecentPayments";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useMembers, useGymAnalytics, useMembersLoaded, useMembersError } from "@/lib/memberStore";
import { buildLiveGymAnalytics } from "@/lib/liveGymAnalytics";
import { downloadDashboardCsv } from "@/lib/exportDashboardCsv";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

const ranges = [{ key: "7d", label: "Last 7 days" }, { key: "30d", label: "Last 30 days" }, { key: "6m", label: "Last 6 months" }, { key: "year", label: "This year" }];

export default function Dashboard() {
  const [range, setRange] = useState("6m");
  const { toast } = useToast();
  const members = useMembers();
  const source = useGymAnalytics();
  const loaded = useMembersLoaded();
  const loadError = useMembersError();
  const data = useMemo(() => buildLiveGymAnalytics(members, source, range), [members, source, range]);
  useEffect(() => { base44.analytics.track({ eventName: "dashboard_viewed" }); }, []);
  if (!loaded) return <Layout><PageSkeleton /></Layout>;

  const handleExport = () => {
    try {
      if (!members.length) {
        toast({ title: "Nothing to export", description: "There are no members to export yet." });
        return;
      }
      downloadDashboardCsv(members);
      toast({ title: "Export ready", description: `Exported ${members.length} member${members.length === 1 ? "" : "s"} to CSV.` });
    } catch {
      toast({ title: "Export failed", description: "Could not generate the CSV. Please try again." });
    }
  };
  const rangeLabel = ranges.find((item) => item.key === range)?.label;
  const sparkValues = data.series.map((bucket) => bucket.revenue);
  const comparison = data.previousRangeRevenue > 0 ? Math.round(((data.rangeRevenue - data.previousRangeRevenue) / data.previousRangeRevenue) * 100) : null;

  return <Layout><div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your real gym data</p>
      </div>
      <button onClick={handleExport} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground"><Download className="w-4 h-4" /> Export</button>
    </div>
    {loadError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{loadError}</div>}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <RevenueHeroCard revenue={data.rangeRevenue} periodLabel={rangeLabel} sparkValues={sparkValues} comparison={comparison} />
      <DashboardKpiCards active={data.stats.activeMembers} expired={data.stats.expired} pending={data.stats.pending} />
    </div>
    <div>
      <div className="flex items-center gap-1.5 flex-wrap justify-end mb-3">{ranges.map((item) => <button key={item.key} onClick={() => setRange(item.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${range === item.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-accent"}`}>{item.label}</button>)}</div>
      <LivePerformanceChart data={data.series} label={rangeLabel} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RecentPayments payments={source.payments} memberships={source.memberships} plans={source.plans} />
      <RecentActivity activities={data.recentActivities} />
    </div>
  </div></Layout>;
}