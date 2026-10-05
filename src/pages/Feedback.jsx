import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, AlertCircle, Lightbulb, Dumbbell, UserCog, RefreshCw } from "lucide-react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

const typeIcon = { Feedback: MessageSquare, Complaint: AlertCircle, "Feature Request": Lightbulb, "Machine Request": Dumbbell, "Coach Request": UserCog };
const statusTone = {
  Pending: "bg-black/5 text-black/60",
  "Under Review": "bg-black/10 text-black",
  Approved: "bg-black text-white",
  Rejected: "bg-black/5 text-black/40 line-through",
  Completed: "bg-black text-white",
};
const STATUSES = ["Pending", "Under Review", "Approved", "Rejected", "Completed"];
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

export default function Feedback() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await invokeWithAuth("gymAccess", { operation: "listFeedback" });
      setItems(result?.data?.feedback || []);
    } catch (error) {
      toast({ title: "Could not load feedback", description: error?.response?.data?.error || error?.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "All" ? items : items.filter((r) => r.status === filter);

  const open = (r) => { setActive(r); setResponse(r.response || ""); };
  const save = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await invokeWithAuth("gymAccess", { operation: "updateFeedback", id: active.id, response: response.trim(), status: active.status });
      toast({ title: "Response sent", description: `${active.title} updated.` });
      setActive(null);
      await load();
    } catch (error) {
      toast({ title: "Update failed", description: error?.response?.data?.error || error?.message || "Please try again." });
    } finally {
      setSaving(false);
    }
  };
  const setStatus = (status) => setActive((current) => current ? { ...current, status } : current);

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Member Feedback</h1>
            <p className="text-sm text-black/50 mt-0.5">Feedback and requests from your gym members</p>
          </div>
          <button onClick={load} disabled={loading} className="p-2 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-50" aria-label="Refresh feedback"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors ${filter === s ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{s}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-black/5 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No feedback here" description="Member feedback will appear here as it comes in." />
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const Icon = typeIcon[r.type] || MessageSquare;
              return (
                <button key={r.id} onClick={() => open(r)} className="w-full text-left bg-white border border-black/10 rounded-xl p-4 hover:bg-black/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{r.type}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusTone[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-sm text-black/50 mt-1 line-clamp-2">{r.body}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                    <span className="text-xs text-black/40">{r.member?.name || "Member"} · {r.date}</span>
                    {r.response ? <span className="text-xs text-black/60 truncate ml-3">Gym: {r.response}</span> : <span className="text-xs text-black/40">Tap to respond</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title || "Feedback"}
        footer={<>
          <button onClick={() => setActive(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90 disabled:opacity-80">{saving ? "Sending..." : "Send response"}</button>
        </>}>
        {active && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{active.type}</span>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusTone[active.status] || "bg-black/5 text-black/60"}`}>{active.status}</span>
            </div>
            <div className="text-xs text-black/40">{active.member?.name || "Member"}{active.member?.phone ? ` · ${active.member.phone}` : ""}</div>
            <p className="text-sm text-black/60">{active.body}</p>
            <div>
              <label className="block text-sm font-medium mb-1.5">Your response</label>
              <textarea rows={3} className={inputCls} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Reply to the member…" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Update status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${active.status === s ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}