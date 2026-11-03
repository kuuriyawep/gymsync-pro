import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import ActionSelect from "@/components/ui/action-select";
import { useToast } from "@/components/ui/use-toast";
import { Megaphone } from "lucide-react";
import { ghostBtn, label, primaryBtn, textarea } from "@/lib/uiClasses";

const TYPES = ["Bug", "UI problem", "Broken feature", "Suggestion", "Feature request", "Performance", "Other"];

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
        <button onClick={onClose} className={ghostBtn}>Cancel</button>
        <button onClick={submit} disabled={!body.trim() || submitting} className={primaryBtn}>
          {submitting ? "Sending..." : "Send feedback"}
        </button>
      </>}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
          <Megaphone className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">This goes to the GymSync product team — not your gym. Report bugs, broken features, or ideas to improve the app itself.</p>
        </div>
        <div>
          <label className={label}>What's this about?</label>
          <ActionSelect value={type} onChange={setType} options={TYPES} ariaLabel="Feedback topic" title="Feedback topic" />
        </div>
        <div>
          <label className={label}>Details</label>
          <textarea rows={4} className={textarea} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe what happened, what you expected, or your suggestion…" />
        </div>
      </div>
    </Modal>
  );
}