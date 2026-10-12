import React, { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/use-toast";
import { Check, Info, MessageSquare, Send } from "lucide-react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import { ghostBtn, primaryBtn, textarea } from "@/lib/uiClasses";

const MAX_LENGTH = 1000;

export default function QuickMessageModal({ open, onClose, member }) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const templates = useMemo(() => {
    if (!member) return [];
    const name = member.name?.split(" ")[0] || "there";
    const days = member.daysRemaining;
    const list = [];
    if (member.status === "Expired" || (typeof days === "number" && days <= 0)) {
      list.push({ label: "Membership expired", text: `Hello ${name}, your gym membership has expired. Please renew your membership to continue using the gym. Thank you.` });
    }
    if (member.status === "Expiring Soon" || (typeof days === "number" && days > 0 && days <= 7)) {
      list.push({ label: "Expiring soon", text: `Hello ${name}, your membership expires in ${days} day${days === 1 ? "" : "s"}. Please renew to keep your streak going. Thank you.` });
    }
    if (member.paymentStatus === "Pending" || member.paymentStatus === "Overdue") {
      list.push({ label: "Payment due", text: `Hello ${name}, your membership payment is currently ${member.paymentStatus.toLowerCase()}. Please complete the payment to keep your membership active. Thank you.` });
    }
    list.push({ label: "General check-in", text: `Hello ${name}, this is a quick message from your gym. Let us know if you need anything. Thank you.` });
    return list;
  }, [member]);

  // reset body when opening with the first template
  React.useEffect(() => {
    if (open && templates.length) setBody(templates[0].text);
    if (!open) setBody("");
  }, [open, templates]);

  if (!member) return null;

  const send = async () => {
    const message = body.trim();
    if (!message || !member?.id) return;
    setSending(true);
    try {
      await invokeWithAuth("gymAccess", { operation: "sendMessage", memberId: member.id, message });
      onClose();
      toast({ title: "Message sent", description: `${member.name} will see it in their member app.` });
    } catch (error) {
      toast({ title: "Message failed", description: error?.response?.data?.error || error?.message || "Could not send the message." });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Quick Message" subtitle="Send an in-app message to this member." icon={MessageSquare}
      footer={<>
        <button onClick={onClose} className={ghostBtn}>Cancel</button>
        <button onClick={send} disabled={!body.trim() || sending} className={primaryBtn}>
          <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send"}
        </button>
      </>}>
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-400">
            {member.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{member.name}</p>
            <p className="truncate text-xs text-muted-foreground">{member.memberId} · {member.phone}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Quick templates</p>
          <div className="space-y-2">
            {templates.map((template) => {
              const activeTemplate = body === template.text;
              return (
                <button key={template.label} type="button" onClick={() => setBody(template.text)}
                  className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${activeTemplate ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-400" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{template.label}</span>
                  {activeTemplate && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Message</span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">In-app</span>
              <span className="text-[11px] text-muted-foreground">{body.length}/{MAX_LENGTH}</span>
            </span>
          </div>
          <textarea rows={5} maxLength={MAX_LENGTH} className={textarea} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message to this member…" />
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 w-3.5 h-3.5 shrink-0 text-emerald-400" /> The member will receive this message inside GymSync.
        </p>
      </div>
    </Modal>
  );
}