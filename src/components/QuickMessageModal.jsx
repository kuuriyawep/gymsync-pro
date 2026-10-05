import React, { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

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
    <Modal open={open} onClose={onClose} title="Quick Message"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
        <button onClick={send} disabled={!body.trim() || sending} className={`px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center gap-2 ${body.trim() && !sending ? "bg-black text-white hover:bg-black/90" : "bg-black/10 text-black/40"}`}>
          <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send"}
        </button>
      </>}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">{member.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
          <div><p className="text-sm font-semibold">{member.name}</p><p className="text-xs text-black/50">{member.memberId} · {member.phone}</p></div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Quick templates</label>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button key={t.label} onClick={() => setBody(t.text)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/15 hover:bg-black/5">{t.label}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Message</label>
            <span className="text-[11px] text-black/40">In-app · {body.length}/1000</span>
          </div>
          <textarea rows={5} maxLength={1000} className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message to this member…" />
          <p className="text-xs text-black/40 mt-1.5">The member will receive this message inside GymSync.</p>
        </div>
      </div>
    </Modal>
  );
}