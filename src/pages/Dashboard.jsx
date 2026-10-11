import React, { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import MiniStatCard from "@/components/dashboard/MiniStatCard";
import RecentActivityList from "@/components/dashboard/RecentActivityList";
import RecentPaymentsTable from "@/components/dashboard/RecentPaymentsTable";
import RevenueHeroCard from "@/components/dashboard/RevenueHeroCard";
import RevenueOverviewChart from "@/components/dashboard/RevenueOverviewChart";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { downloadDashboardCsv } from "@/lib/exportDashboardCsv";
import { buildMemberMetrics, buildRecentPayments, buildRevenueMetrics, buildRevenueSeries } from "@/lib/gymMetrics";
import { useGym } from "@/lib/gymStore";
import { useGymAnalytics, useMembers, useMembersError, useMembersLoaded } from "@/lib/memberStore";

export default function Dashboard() {
  const [range, setRange] = useState("30d");
  const { toast } = useToast();
  const members = useMembers();
  const source = useGymAnalytics();
  const gym = useGym();
  const loaded = useMembersLoaded();
  const loadError = useMembersError();

  const payments = source.payments || [];
  const memberships = source.memberships || [];
  const revenue = useMemo(() => buildRevenueMetrics(payments), [payments]);
  const series = useMemo(() => buildRevenueSeries(payments, range), [payments, range]);
  const metrics = useMemo(() => buildMemberMetrics(members, memberships), [members, memberships]);
  const recentPayments = useMemo(() => buildRecentPayments(payments, memberships, members), [payments, memberships, members]);

  useEffect(() => { base44.analytics.track({ eventName: "dashboard_viewed" }); }, []);
  if (!loaded) return <Layout dark><PageSkeleton /></Layout>;

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

  return <Layout dark><div className="space-y-4 text-foreground sm:space-y-6">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Here's what's happening with your gym today.</p>
      </div>
      <button onClick={handleExport} title="Export members as CSV" aria-label="Export members as CSV" className="shrink-0 rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground">
        <Download className="w-4 h-4" />
      </button>
    </div>

    {loadError && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{loadError}</div>}

    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <RevenueHeroCard revenue={revenue} />
      <div className="grid gap-2 sm:gap-3">
        <MiniStatCard label="Active Members" value={metrics.active} change={metrics.activeChange} />
        <MiniStatCard label="Expired Memberships" value={metrics.expired} change={metrics.expiredChange} />
        <MiniStatCard label="Pending" value={metrics.pending} change={metrics.pendingChange} />
      </div>
    </div>

    <RevenueOverviewChart series={series} range={range} onRangeChange={setRange} currency={gym?.membershipDefaults?.currency || "USD"} />

    <div className="grid gap-4 lg:grid-cols-2">
      <RecentPaymentsTable payments={recentPayments} />
      <RecentActivityList activities={source.recentActivities} />
    </div>
  </div></Layout>;
}