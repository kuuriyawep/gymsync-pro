import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/use-toast";
import { Megaphone } from "lucide-react";

const TYPES = ["Bug", "UI problem", "Broken feature", "Suggestion", "Feature request", "Performance", "Other"];
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

export default function AppFeedbackModal({ open, onClose }) {
  const { toast } = useToast();
  const [type, setType] = useState("Bug");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (!body.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setBody("");
      setType("Bug");
      onClose();
      toast({ title: "Feedback sent to GymSync", description: "Thanks for helping us improve the app." });
    }, 600);
  };

  return (
    <Modal open={open} onClose={onClose} title="Feedback about GymSync"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
        <button onClick={submit} disabled={!body.trim() || submitting} className={`px-4 py-2 text-sm font-medium rounded-lg ${body.trim() && !submitting ? "bg-black text-white hover:bg-black/90" : "bg-black/10 text-black/40"}`}>
          {submitting ? "Sending..." : "Send feedback"}
        </button>
      </>}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-black/[0.02] rounded-lg p-3">
          <Megaphone className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs text-black/60">This goes to the GymSync product team — not your gym. Report bugs, broken features, or ideas to improve the app itself.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">What's this about?</label>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Details</label>
          <textarea rows={4} className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe what happened, what you expected, or your suggestion…" />
        </div>
      </div>
    </Modal>
  );
}