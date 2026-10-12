import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Download, FileSpreadsheet, FileText, Layers, Printer, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import ReportKpiRow from "@/components/reports/ReportKpiRow";
import IncomeOverviewChart from "@/components/reports/IncomeOverviewChart";
import RevenueBreakdown from "@/components/reports/RevenueBreakdown";
import TopPlansList from "@/components/reports/TopPlansList";
import LiveRevenueReport from "@/components/reports/LiveRevenueReport";
import LiveMemberReport from "@/components/reports/LiveMemberReport";
import LiveMembershipReport from "@/components/reports/LiveMembershipReport";
import RecentPaymentsTable from "@/components/dashboard/RecentPaymentsTable";
import RecentActivityList from "@/components/dashboard/RecentActivityList";
import { useMembers, useGymAnalytics, useMembersLoaded, useMembersError } from "@/lib/memberStore";
import { buildLiveGymAnalytics } from "@/lib/liveGymAnalytics";
import { buildMemberMetrics, buildRecentPayments, buildRevenueMetrics, money, parseDate, percentChange } from "@/lib/gymMetrics";
import { downloadReportsCsv } from "@/lib/exportReportsCsv";
import { downloadReportsPdf } from "@/lib/exportReportsPdf";
import { useToast } from "@/components/ui/use-toast";
import { card, ghostBtn, pill, primaryBtn, sectionLabel } from "@/lib/uiClasses";
import { format } from "date-fns";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "income", label: "Income" },
  { key: "members", label: "Members" },
  { key: "payments", label: "Payments" },
  { key: "trainers", label: "Trainers" },
];
const RANGE_LABELS = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "6m": "Last 6 months", year: "This year" };

export default function Reports() {
  const [tab, setTab] = useState("overview");
  const [range, setRange] = useState("30d");
  const [exportOpen, setExportOpen] = useState(false);
  const { toast } = useToast();
  const members = useMembers();
  const source = useGymAnalytics();
  const loaded = useMembersLoaded();
  const loadError = useMembersError();
  const data = useMemo(() => buildLiveGymAnalytics(members, source, range), [members, source, range]);
  const label = RANGE_LABELS[range] || "Selected range";

  const payments = useMemo(() => source.payments || [], [source.payments]);
  const memberships = useMemo(() => source.memberships || [], [source.memberships]);
  const revenue = useMemo(() => buildRevenueMetrics(payments), [payments]);
  const memberMetrics = useMemo(() => buildMemberMetrics(members, memberships), [members, memberships]);
  const recentPayments = useMemo(() => buildRecentPayments(payments, memberships, members, 5), [payments, memberships, members]);
  const recentAll = useMemo(() => buildRecentPayments(payments, memberships, members, 10), [payments, memberships, members]);

  // Month-over-month counters for new registrations and completed payments.
  const monthCounters = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(monthStart.getTime() - 1);
    const inWindow = (value, start, end) => { const date = parseDate(value); return Boolean(date) && date >= start && date <= end; };
    const created = (member) => member.createdAt || member.registeredDate;
    return {
      newMembers: members.filter((m) => inWindow(created(m), monthStart, now)).length,
      prevNewMembers: members.filter((m) => inWindow(created(m), prevStart, prevEnd)).length,
      paymentCount: payments.filter((p) => inWindow(p.paidAt, monthStart, now)).length,
      prevPaymentCount: payments.filter((p) => inWindow(p.paidAt, prevStart, prevEnd)).length,
    };
  }, [members, payments]);

  // Income per plan: a payment belongs to a plan through its membership period.
  const planIncome = useMemo(() => {
    const planById = new Map((source.plans || []).map((plan) => [plan.id, plan]));
    const membershipById = new Map(memberships.map((membership) => [membership.id, membership]));
    const activeByPlan = new Map((data.planPerformance || []).map((entry) => [entry.plan, entry.count]));
    const totals = new Map();
    payments.forEach((payment) => {
      const membership = payment.membershipId ? membershipById.get(payment.membershipId) : null;
      const name = planById.get(membership?.planId)?.name || "Other payments";
      totals.set(name, (totals.get(name) || 0) + Number(payment.amount || 0));
    });
    return [...totals.entries()]
      .map(([name, total]) => ({ name, revenue: total, count: activeByPlan.get(name) || 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [source.plans, memberships, payments, data.planPerformance]);

  const methodTotals = useMemo(() => {
    const map = new Map();
    payments.forEach((payment) => {
      const name = String(payment.method || "cash").replace(/_/g, " ");
      const entry = map.get(name) || { name, count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(payment.amount || 0);
      map.set(name, entry);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [payments]);

  if (!loaded) return <Layout dark><PageSkeleton cards={5} rows={4} /></Layout>;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthRange = `${format(monthStart, "MMM d")} – ${format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "MMM d, yyyy")}`;
  const kpis = [
    { key: "income", label: "Total Income", value: money(revenue.total), change: revenue.change },
    { key: "members", label: "New Members", value: String(monthCounters.newMembers), change: percentChange(monthCounters.newMembers, monthCounters.prevNewMembers) },
    { key: "payments", label: "Total Payments", value: String(monthCounters.paymentCount), change: percentChange(monthCounters.paymentCount, monthCounters.prevPaymentCount) },
    { key: "expiring", label: "Expiring Soon", value: String(memberMetrics.expiring), change: memberMetrics.expiringChange },
  ];

  const handleExportCsv = () => {
    setExportOpen(false);
    try {
      downloadReportsCsv(data, label);
      toast({ title: "Export ready", description: "Report CSV downloaded." });
    } catch {
      toast({ title: "Export failed", description: "Could not generate the CSV. Please try again." });
    }
  };
  const handleExportPdf = () => {
    setExportOpen(false);
    try {
      downloadReportsPdf(data, label);
      toast({ title: "Export ready", description: "Report PDF downloaded." });
    } catch {
      toast({ title: "Export failed", description: "Could not generate the PDF. Please try again." });
    }
  };

  return (
    <Layout dark>
      <div className="space-y-4 text-foreground sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Reports</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">View your gym's performance and financial reports.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground sm:block">{monthRange}</span>
            <div className="relative">
              <button onClick={() => setExportOpen((open) => !open)} className={primaryBtn}><Download className="w-4 h-4" /> Export <ChevronDown className="w-3.5 h-3.5" /></button>
              <AnimatePresence>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-12 z-40 w-44 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl">
                      <button onClick={handleExportCsv} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"><FileSpreadsheet className="w-4 h-4" /> Export CSV</button>
                      <button onClick={handleExportPdf} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"><FileText className="w-4 h-4" /> Export PDF</button>
                      <button onClick={() => { setExportOpen(false); window.print(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"><Printer className="w-4 h-4" /> Print</button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {loadError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{loadError}</div>}

        <div className="-mb-1 flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} aria-pressed={tab === item.key} className={pill(tab === item.key)}>{item.label}</button>)}
        </div>

        {tab === "overview" && (
          <>
            <ReportKpiRow items={kpis} />
            <IncomeOverviewChart series={data.series} range={range} onRangeChange={setRange} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <RevenueBreakdown breakdown={[{ name: "Membership Payments", value: revenue.membership }, { name: "One-time Payments", value: revenue.other }]} />
              <div className="lg:col-span-2"><TopPlansList plans={planIncome} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RecentPaymentsTable payments={recentPayments} />
              <RecentActivityList activities={data.recentActivities} />
            </div>
          </>
        )}

        {tab === "income" && <LiveRevenueReport data={data} label={label} />}

        {tab === "members" && <div className="space-y-6"><LiveMemberReport data={data} /><LiveMembershipReport data={data} /></div>}

        {tab === "payments" && (
          <div className="space-y-4">
            <div className={`${card} p-4 sm:p-5`}>
              <h3 className="font-heading font-semibold">Received by Payment Method</h3>
              <p className="mb-2 text-xs text-muted-foreground">Every payment recorded for this gym</p>
              {methodTotals.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {methodTotals.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium capitalize">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.count} payment{entry.count === 1 ? "" : "s"}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">{money(entry.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <RecentPaymentsTable payments={recentAll} />
          </div>
        )}

        {tab === "trainers" && (
          <div className="space-y-4">
            <h2 className={sectionLabel}>Trainers</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className={`${card} p-4`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><Users className="w-4 h-4" /></span><p className="mt-2 text-xl font-bold tabular-nums">{data.stats.activeTrainers}</p><p className="text-xs text-muted-foreground">Active Trainers</p></div>
              <div className={`${card} p-4`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><Layers className="w-4 h-4" /></span><p className="mt-2 text-xl font-bold tabular-nums">{(source.trainers || []).length}</p><p className="text-xs text-muted-foreground">Total Trainers</p></div>
            </div>
            <div className={`${card} p-4 sm:p-5`}>
              <h3 className="font-heading font-semibold">Trainer Records</h3>
              <p className="mt-1 text-sm text-muted-foreground">Assignments, contact details and trainer history are managed on the Trainers page.</p>
              <Link to="/trainers" className={`${ghostBtn} mt-4`}><Users className="w-4 h-4" /> Open Trainers</Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}