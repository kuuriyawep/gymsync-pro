import React, { useState, useEffect } from "react";
import MemberLayout from "@/components/MemberLayout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/ui/use-toast";
import { Plus, MessageSquare, AlertCircle, Lightbulb, Dumbbell, UserCog, CheckCircle2, Clock3, XCircle, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { memberRequests } from "@/lib/memberMockData";

const typeIcon = { Feedback: MessageSquare, Complaint: AlertCircle, "Feature Request": Lightbulb, "Machine Request": Dumbbell, "Coach Request": UserCog };
const statusTone = {
  Pending: "bg-black/5 text-black/60",
  "Under Review": "bg-black/10 text-black",
  Approved: "bg-black text-white",
  Rejected: "bg-black/5 text-black/40 line-through",
  Completed: "bg-black text-white",
};
const statusIcon = { Pending: Clock3, "Under Review": Eye, Approved: CheckCircle2, Rejected: XCircle, Completed: CheckCircle2 };
const STATUSES = ["Pending", "Under Review", "Approved", "Rejected", "Completed"];
const TYPES = ["Feedback", "Complaint", "Feature Request", "Machine Request", "Coach Request"];
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

export default function MemberFeedback() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState(memberRequests);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({ type: "Feedback", title: "", body: "" });
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const submit = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Please add a short title";
    if (!form.body.trim()) e.body = "Please describe your request";
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = Math.max(...requests.map((r) => r.id), 0) + 1;
    setRequests((rs) => [{ id, type: form.type, title: form.title.trim(), body: form.body.trim(), status: "Pending", date: "2026-09-01", response: null }, ...rs]);
    setOpen(false);
    setForm({ type: "Feedback", title: "", body: "" });
    toast({ title: "Request submitted", description: "Your gym will review it shortly." });
  };

  const filtered = filter === "All" ? requests : requests.filter((r) => r.status === filter);

  if (loading) return <MemberLayout title="Feedback" back="/member"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-black/5 animate-pulse" />)}</div></MemberLayout>;

  return (
    <MemberLayout title="Feedback" back="/member">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-bold tracking-tight">Feedback & Requests</h1>
            <p className="text-sm text-black/50">Send feedback, complaints or requests to your gym</p>
          </div>
          <button onClick={() => { setErrors({}); setOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90"><Plus className="w-4 h-4" /> New</button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors ${filter === s ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{s}</button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No requests here" description="Submit a new request to get started." actionLabel="New request" onAction={() => setOpen(true)} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((r) => {
                const Icon = typeIcon[r.type];
                const SIcon = statusIcon[r.status];
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white border border-black/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{r.type}</span>
                      <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusTone[r.status]}`}><SIcon className="w-3 h-3" />{r.status}</span>
                    </div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-sm text-black/50 mt-1">{r.body}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                      <span className="text-xs text-black/40">{r.date}</span>
                      {r.response && <span className="text-xs text-black/60"><span className="font-medium">Gym:</span> {r.response}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <Modal open={open} onClose={() => setOpen(false)} title="New request"
          footer={<>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
            <button onClick={submit} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">Submit</button>
          </>}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Request type</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input className={`${inputCls} ${errors.title ? "border-black bg-black/5" : ""}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short summary" />
              {errors.title && <p className="text-xs text-black font-medium mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Details</label>
              <textarea rows={4} className={`${inputCls} ${errors.body ? "border-black bg-black/5" : ""}`} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Describe your feedback, complaint or request…" />
              {errors.body && <p className="text-xs text-black font-medium mt-1">{errors.body}</p>}
            </div>
          </div>
        </Modal>
      </div>
    </MemberLayout>
  );
}