import React, { useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import MemberLayout from "@/components/MemberLayout";
import MemberDataState from "@/components/member/MemberDataState";
import PortalPill from "@/components/member/PortalPill";
import Modal from "@/components/ui/Modal";
import ActionSelect from "@/components/ui/action-select";
import { useToast } from "@/components/ui/use-toast";
import { useMemberPortal, createMemberFeedback } from "@/lib/memberPortalStore";
import { ghostBtn, input, label, primaryBtn, textarea } from "@/lib/uiClasses";

const types = ["Feedback", "Complaint", "Feature Request", "Machine Request", "Coach Request"];
const statuses = ["All", "Pending", "Under Review", "Approved", "Rejected", "Completed"];

const pill = (active) => `shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`;

export default function MemberFeedback() {
  const { data, loaded, error } = useMemberPortal();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "Feedback", title: "", body: "" });
  const { toast } = useToast();

  if (!loaded) {
    return <MemberLayout title="Feedback"><div className="h-80 bg-muted animate-pulse rounded-xl" /></MemberLayout>;
  }
  if (!data) return <MemberDataState title="Feedback" error={error} />;

  const requests = filter === "All" ? data.feedback : data.feedback.filter((item) => item.status === filter);

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      await createMemberFeedback(form);
      setOpen(false);
      setForm({ type: "Feedback", title: "", body: "" });
      toast({ title: "Request submitted", description: "Your gym will review it shortly." });
    } catch (err) {
      toast({ title: "Request failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MemberLayout title="Feedback" back="/member">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-heading font-bold">Feedback & Requests</h1>
            <p className="text-sm text-muted-foreground">Send a request to your gym</p>
          </div>
          <button onClick={() => setOpen(true)} className={primaryBtn}><Plus className="w-4 h-4" /> New</button>
        </div>

        <div className="-mb-1 flex gap-1.5 overflow-x-auto pb-1">
          {statuses.map((status) => (
            <button key={status} onClick={() => setFilter(status)} aria-pressed={filter === status} className={pill(filter === status)}>{status}</button>
          ))}
        </div>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <MessageSquare className="mx-auto w-7 h-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No requests here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{item.type}</span>
                  <PortalPill status={item.status} className="!px-2 !py-0.5 !text-[10px]" />
                </div>
                <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-3 text-xs text-muted-foreground">{item.date}</p>
                {item.response && <p className="mt-3 border-t border-border pt-3 text-sm"><b>Gym:</b> {item.response}</p>}
              </div>
            ))}
          </div>
        )}

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="New request"
          footer={<>
            <button onClick={() => setOpen(false)} className={ghostBtn}>Cancel</button>
            <button onClick={submit} disabled={saving} className={primaryBtn}>{saving ? "Submitting…" : "Submit"}</button>
          </>}
        >
          <div className="space-y-4">
            <div>
              <label className={label}>Request type</label>
              <ActionSelect value={form.type} onChange={(type) => setForm({ ...form, type })} options={types} ariaLabel="Request type" title="Request type" />
            </div>
            <div>
              <label className={label}>Title</label>
              <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What is this about?" />
            </div>
            <div>
              <label className={label}>Details</label>
              <textarea rows={4} className={textarea} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Add any details your gym needs." />
            </div>
          </div>
        </Modal>
      </div>
    </MemberLayout>
  );
}