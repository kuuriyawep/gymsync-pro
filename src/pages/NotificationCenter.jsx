import React, { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import { Bell, CheckCheck, UserX, Clock, UserPlus, RefreshCw, CreditCard, UserCog, Search } from "lucide-react";
import { notifications as seed } from "@/lib/mockData";
import { motion } from "framer-motion";

const typeIcon = { expired: UserX, expiring: Clock, member: UserPlus, renewal: RefreshCw, payment: CreditCard, trainer: UserCog };
const filters = ["All", "Unread", "Renewals", "System"];

export default function NotificationCenter() {
  const [items, setItems] = useState(seed);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const unread = items.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "Unread") list = list.filter((n) => !n.read);
    if (filter === "Renewals") list = list.filter((n) => n.type === "expired" || n.type === "expiring" || n.type === "renewal");
    if (filter === "System") list = list.filter((n) => n.type === "member" || n.type === "trainer" || n.type === "payment");
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((n) => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
    return list;
  }, [items, filter, query]);

  const markRead = (id) => setItems((xs) => xs.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setItems((xs) => xs.map((n) => ({ ...n, read: true })));

  if (loading) return <Layout><PageSkeleton cards={2} rows={5} /></Layout>;

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Notification Center</h1>
            <p className="text-sm text-black/50 mt-0.5">{unread > 0 ? `${unread} unread alert${unread > 1 ? "s" : ""}` : "You're all caught up"}</p>
          </div>
          <button onClick={markAllRead} disabled={unread === 0} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5 disabled:opacity-40">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === f ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 sm:ml-auto">
            <Search className="w-4 h-4 text-black/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search alerts…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-black/10 rounded-xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4"><Bell className="w-7 h-7 text-black/40" /></div>
            <p className="text-base font-semibold">No notifications</p>
            <p className="text-sm text-black/50 mt-1">Alerts about renewals and updates will appear here.</p>
          </div>
        ) : (
          <div className="bg-white border border-black/10 rounded-xl divide-y divide-black/5 overflow-hidden">
            {filtered.map((n, i) => {
              const Icon = typeIcon[n.type] ?? Bell;
              return (
                <motion.button key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.2 }}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 w-full px-4 md:px-5 py-4 text-left hover:bg-black/[0.02] transition-colors ${!n.read ? "bg-black/[0.015]" : ""}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? "bg-black text-white" : "bg-black/5"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />}
                    </div>
                    <p className="text-sm text-black/60 mt-0.5">{n.description}</p>
                    <p className="text-xs text-black/40 mt-1">{n.time}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}