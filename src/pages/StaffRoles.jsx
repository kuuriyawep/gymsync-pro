import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import { ShieldCheck, Check, UserCog } from "lucide-react";
import { staff as seed, staffRoles, staffPermissions } from "@/lib/mockData";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const inputCls = "w-full px-3 py-2 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const roleBadge = (r) => r === "Owner" ? "bg-black text-white" : r === "Manager" ? "bg-black/10 text-black" : "bg-black/5 text-black/70";
const initials = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function StaffRoles() {
  const { toast } = useToast();
  const [list, setList] = useState(seed);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(seed[1]?.id ?? null);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const current = list.find((s) => s.id === selected) ?? list[0];
  const editableRoles = staffRoles.filter((r) => r !== "Owner");

  const setRole = (id, role) => {
    setList((xs) => xs.map((s) => (s.id === id ? { ...s, role } : s)));
    const name = list.find((s) => s.id === id)?.name;
    toast({ title: "Role updated", description: `${name} is now ${role}` });
  };

  if (loading) return <Layout><PageSkeleton cards={2} rows={4} /></Layout>;

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Staff Roles</h1>
          <p className="text-sm text-black/50 mt-0.5">Assign operational permissions to your team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Staff list */}
          <div className="lg:col-span-2 bg-white border border-black/10 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-black/10 text-xs font-semibold uppercase tracking-wider text-black/40">Team Members</div>
            <div className="divide-y divide-black/5">
              {list.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.2 }}
                  className={`flex items-center gap-3 px-4 md:px-5 py-3.5 cursor-pointer hover:bg-black/[0.02] ${selected === s.id ? "bg-black/[0.02]" : ""}`}
                  onClick={() => setSelected(s.id)}>
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold shrink-0">{initials(s.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-black/50 truncate">{s.email}</p>
                  </div>
                  {s.role === "Owner" ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-black text-white">Owner</span>
                  ) : (
                    <select value={s.role} onChange={(e) => setRole(s.id, e.target.value)} onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1.5 rounded-lg border border-black/15 text-xs font-medium bg-white hover:bg-black/5">
                      {editableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Permissions panel */}
          <div className="bg-white border border-black/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="font-semibold">Permissions</h3>
            </div>
            <p className="text-xs text-black/50">What {current?.name?.split(" ")[0]} can do as {current?.role}.</p>

            <div className="mt-4">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(current?.role)}`}>{current?.role}</span>
            </div>

            <div className="mt-4 space-y-2">
              {current?.role === "Owner" ? (
                <div className="flex items-start gap-2 text-sm text-black/70">
                  <Check className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <span>Full access — owners can manage everything, including settings and staff.</span>
                </div>
              ) : staffPermissions[current?.role] ? (
                staffPermissions[current?.role].can.map((c) => (
                  <div key={c} className="flex items-start gap-2 text-sm text-black/70">
                    <Check className="w-4 h-4 text-black mt-0.5 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-sm text-black/40">
                  <UserCog className="w-4 h-4" /> No permissions defined.
                </div>
              )}
            </div>

            {current?.role !== "Owner" && (
              <div className="mt-5 pt-4 border-t border-black/10">
                <label className="block text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">Change role</label>
                <select className={inputCls} value={current?.role} onChange={(e) => setRole(current.id, e.target.value)}>
                  {editableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}