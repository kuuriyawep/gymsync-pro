import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import { Search, Mail, Phone, Clock, UserCog, Briefcase } from "lucide-react";
import { staff } from "@/lib/mockData";
import { motion } from "framer-motion";

const shifts = {
  1: "Flexible (on-call)",
  2: "Mon–Fri · 6:00–14:00",
  3: "Mon–Fri · 14:00–22:00",
  4: "Weekends · 8:00–16:00",
};

const roleBadge = (r) => r === "Owner" ? "bg-black text-white" : r === "Manager" ? "bg-black/10 text-black" : "bg-black/5 text-black/70";
const initials = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function StaffDirectory() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [query]);

  if (loading) return <Layout><PageSkeleton cards={3} rows={4} /></Layout>;

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Staff Directory</h1>
          <p className="text-sm text-black/50 mt-0.5">Contact details, roles and shift assignments</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/5">
          <Search className="w-4 h-4 text-black/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, role or email…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40" />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-black/10 rounded-xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4"><UserCog className="w-7 h-7 text-black/40" /></div>
            <p className="text-base font-semibold">No staff found</p>
            <p className="text-sm text-black/50 mt-1">Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filtered.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.25 }}
                className="bg-white border border-black/10 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-sm font-semibold shrink-0">{initials(s.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{s.name}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${roleBadge(s.role)}`}>{s.role}</span>
                    </div>
                    <p className="text-xs text-black/50 mt-0.5">{s.status === "Invited" ? "Invited" : s.lastActive}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-black/70"><Mail className="w-4 h-4 text-black/40" /> <span className="truncate">{s.email}</span></div>
                  <div className="flex items-center gap-2 text-black/70"><Phone className="w-4 h-4 text-black/40" /> +1 555 020{s.id}</div>
                  <div className="flex items-center gap-2 text-black/70"><Clock className="w-4 h-4 text-black/40" /> {shifts[s.id] ?? "Not assigned"}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}