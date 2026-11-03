import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, AlertCircle, Lightbulb, Dumbbell, UserCog, RefreshCw } from "lucide-react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import { ghostBtn, label, primaryBtn, textarea } from "@/lib/uiClasses";

const typeIcon = { Feedback: MessageSquare, Complaint: AlertCircle, "Feature Request": Lightbulb, "Machine Request": Dumbbell, "Coach Request": UserCog };
const statusTone = {
  Pending: "bg-amber-500/15 text-amber-500",
  "Under Review": "bg-blue-500/15 text-blue-500",
  Approved: "bg-emerald-500/15 text-emerald-500",
  Rejected: "bg-red-500/15 text-red-500 line-through",
  Completed: "bg-emerald-500/15 text-emerald-500",
};
const STATUSES = ["Pending", "Under Review", "Approved", "Rejected", "Completed"];

const pillCls = (active) => `shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`;

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
      // Base44 function responses are normally { data: ... }, but keep the
      // page tolerant of a direct payload so a deployment/proxy wrapper
      // cannot make valid feedback appear empty.
      const payload = result?.data ?? result ?? {};
      const feedback = Array.isArray(payload.feedback) ? payload.feedback : [];
      setItems(feedback.sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))));
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
      <div className="space-y-4 text-foreground sm:space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Member Feedback</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Feedback and requests from your gym members.</p>
          </div>
          <button onClick={load} disabled={loading} className="shrink-0 rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50" aria-label="Refresh feedback">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="-mb-1 flex items-center gap-1.5 overflow-x-auto pb-1">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={pillCls(filter === s)}>{s}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-accent" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No feedback here" description="Member feedback will appear here as it comes in." />
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const Icon = typeIcon[r.type] || MessageSquare;
              return (
                <button key={r.id} onClick={() => open(r)} className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/40">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-muted-foreground"><Icon className="h-4 w-4" /></div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{r.type}</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[r.status] || "bg-accent text-muted-foreground"}`}>{r.status}</span>
                  </div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.body}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">{r.member?.name || "Member"} · {r.date}</span>
                    {r.response ? <span className="ml-3 truncate text-xs text-muted-foreground">Gym: {r.response}</span> : <span className="text-xs text-muted-foreground">Tap to respond</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title || "Feedback"} subtitle="Reply to the member and update the request status." icon={MessageSquare}
        footer={<>
          <button onClick={() => setActive(null)} className={ghostBtn}>Cancel</button>
          <button onClick={save} disabled={saving} className={primaryBtn}>{saving ? "Sending..." : "Send response"}</button>
        </>}>
        {active && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{active.type}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[active.status] || "bg-accent text-muted-foreground"}`}>{active.status}</span>
            </div>
            <div className="text-xs text-muted-foreground">{active.member?.name || "Member"}{active.member?.phone ? ` · ${active.member.phone}` : ""}</div>
            <p className="rounded-xl border border-border bg-accent/40 p-3 text-sm">{active.body}</p>
            <div>
              <label className={label}>Your response</label>
              <textarea rows={3} className={textarea} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Reply to the member…" />
            </div>
            <div>
              <p className={label}>Update status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => setStatus(s)} className={pillCls(active.status === s)}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}