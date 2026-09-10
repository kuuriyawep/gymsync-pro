import React, { useMemo, useState } from "react";
import { Download, ChevronDown, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import LiveRevenueReport from "@/components/reports/LiveRevenueReport";
import LiveMemberReport from "@/components/reports/LiveMemberReport";
import LiveMembershipReport from "@/components/reports/LiveMembershipReport";
import { useMembers, useGymAnalytics, useMembersLoaded } from "@/lib/memberStore";
import { buildLiveGymAnalytics } from "@/lib/liveGymAnalytics";

const ranges = [{ key: "7d", label: "Last 7 days" }, { key: "30d", label: "Last 30 days" }, { key: "6m", label: "Last 6 months" }, { key: "year", label: "This year" }];
export default function Reports() {
  const [range, setRange] = useState("6m");
  const [exportOpen, setExportOpen] = useState(false);
  const members = useMembers();
  const source = useGymAnalytics();
  const loaded = useMembersLoaded();
  const data = useMemo(() => buildLiveGymAnalytics(members, source, range), [members, source, range]);
  if (!loaded) return <Layout><PageSkeleton cards={5} rows={4} /></Layout>;
  const label = ranges.find((item) => item.key === range)?.label;
  return <Layout><div className="space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Reports</h1><p className="text-sm text-black/50 mt-0.5">Performance calculated from your real records</p></div><div className="relative"><button onClick={() => setExportOpen((open) => !open)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white"><Download className="w-4 h-4" /> Export <ChevronDown className="w-3.5 h-3.5" /></button><AnimatePresence>{exportOpen && <><div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} /><motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-11 z-20 bg-white border border-black/10 rounded-lg shadow-lg w-44 py-1"><button onClick={() => setExportOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-sm"><FileSpreadsheet className="w-4 h-4" /> Export CSV</button><button onClick={() => setExportOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-sm"><FileText className="w-4 h-4" /> Export PDF</button><button onClick={() => window.print()} className="flex items-center gap-2 w-full px-3 py-2 text-sm"><Printer className="w-4 h-4" /> Print</button></motion.div></>}</AnimatePresence></div></div>
    <div className="flex items-center gap-1.5 flex-wrap">{ranges.map((item) => <button key={item.key} onClick={() => setRange(item.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${range === item.key ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15"}`}>{item.label}</button>)}</div>
    <LiveRevenueReport data={data} label={label} />
    <LiveMemberReport data={data} />
    <LiveMembershipReport data={data} />
  </div></Layout>;
}