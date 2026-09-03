import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/PageSkeleton";
import Modal from "@/components/ui/Modal";
import { DoorOpen, KeyRound, ShieldCheck, ShieldAlert, Clock, RefreshCw, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";

const seedDoors = [
  { id: 1, name: "Main Entrance", credential: "4821", type: "PIN", lastUpdated: "2026-08-30", status: "Active" },
  { id: 2, name: "Locker Room", credential: "A102", type: "Card", lastUpdated: "2026-08-15", status: "Active" },
  { id: 3, name: "Studio B", credential: "7733", type: "PIN", lastUpdated: "2026-07-20", status: "Active" },
  { id: 4, name: "Back Office", credential: "5510", type: "PIN", lastUpdated: "2026-06-02", status: "Locked" },
];

const seedLogs = [
  { id: 1, member: "Sarah Chen", door: "Main Entrance", time: "Today · 06:42", result: "Granted" },
  { id: 2, member: "Marcus Reed", door: "Main Entrance", time: "Today · 07:15", result: "Granted" },
  { id: 3, member: "Unknown tag", door: "Studio B", time: "Today · 08:03", result: "Denied" },
  { id: 4, member: "Aisha Khan", door: "Locker Room", time: "Today · 08:20", result: "Granted" },
  { id: 5, member: "Diego Santos", door: "Main Entrance", time: "Yesterday · 18:55", result: "Denied" },
  { id: 6, member: "Omar Farah", door: "Main Entrance", time: "Yesterday · 17:10", result: "Granted" },
];

export default function FacilityAccess() {
  const { toast } = useToast();
  const [doors, setDoors] = useState(seedDoors);
  const [logs] = useState(seedLogs);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [pin, setPin] = useState("");
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const openEdit = (d) => { setEditing(d); setPin(d.type === "PIN" ? d.credential : ""); };
  const savePin = () => {
    if (!pin.trim()) return;
    setDoors((ds) => ds.map((d) => (d.id === editing.id ? { ...d, credential: pin.trim(), lastUpdated: new Date().toISOString().slice(0, 10) } : d)));
    toast({ title: "Credential updated", description: editing.name });
    setEditing(null);
  };
  const toggleLock = (d) => {
    setDoors((ds) => ds.map((x) => (x.id === d.id ? { ...x, status: x.status === "Active" ? "Locked" : "Active" } : x)));
    toast({ title: d.status === "Active" ? "Door locked" : "Door unlocked", description: d.name });
  };

  if (loading) return <Layout><PageSkeleton cards={2} rows={4} /></Layout>;

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Facility Access</h1>
          <p className="text-sm text-black/50 mt-0.5">Digital entry credentials and door access logs</p>
        </div>

        {/* Doors */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-3">Access Doors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {doors.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.25 }}
                className="bg-white border border-black/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${d.status === "Active" ? "bg-black text-white" : "bg-black/5 text-black/50"}`}>
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-xs text-black/50 mt-0.5">Updated {d.lastUpdated}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${d.status === "Active" ? "bg-black/10 text-black" : "border border-black text-black/60"}`}>
                    {d.status === "Active" ? <ShieldCheck className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {d.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/5">
                  <KeyRound className="w-4 h-4 text-black/40" />
                  <span className="text-sm font-mono tracking-wider flex-1">{d.type === "PIN" ? `PIN · ${d.credential}` : `Card · ${d.credential}`}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => openEdit(d)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">
                    <RefreshCw className="w-3.5 h-3.5" /> Update credential
                  </button>
                  <button onClick={() => toggleLock(d)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
                    {d.status === "Active" ? <Lock className="w-3.5 h-3.5" /> : <DoorOpen className="w-3.5 h-3.5" />}
                    {d.status === "Active" ? "Lock" : "Unlock"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Access logs */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-3">Recent Access Logs</h3>
          <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
            <div className="divide-y divide-black/5">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-4 md:px-5 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${l.result === "Granted" ? "bg-black/5" : "bg-black text-white"}`}>
                    {l.result === "Granted" ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.member}</p>
                    <p className="text-xs text-black/50">{l.door}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-black/50 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> {l.time}</p>
                    <span className={`text-xs font-medium ${l.result === "Granted" ? "text-black/70" : "text-black"}`}>{l.result}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Update credential"
        footer={<>
          <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={savePin} disabled={!pin.trim()} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90 disabled:opacity-40">Save credential</button>
        </>}>
        {editing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/5">
              <DoorOpen className="w-4 h-4 text-black/40" />
              <span className="text-sm font-medium">{editing.name}</span>
            </div>
            {editing.type === "PIN" ? (
              <div><label className={labelCls}>New PIN</label>
                <input className={inputCls} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter a 4–6 digit PIN" inputMode="numeric" />
                <p className="text-xs text-black/50 mt-1">Members will use this PIN at the door keypad.</p></div>
            ) : (
              <div><label className={labelCls}>Card ID</label>
                <input className={inputCls} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Card identifier" />
                <p className="text-xs text-black/50 mt-1">Replace the card assigned to this door.</p></div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}