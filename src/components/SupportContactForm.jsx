import React, { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function SupportContactForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", priority: "Normal", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setForm({ name: "", email: "", subject: "", priority: "Normal", message: "" });
      toast({ title: "Message sent", description: "Our support team will get back to you shortly." });
    }, 800);
  };

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Contact Support</h2>
      <p className="text-sm text-black/50 mt-1 mb-5">Describe your issue and we'll respond by email.</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sup-name">Name</Label>
            <Input id="sup-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-email">Email</Label>
            <Input id="sup-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@gym.com" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sup-subject">Subject</Label>
            <Input id="sup-subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Brief summary" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-priority">Priority</Label>
            <select
              id="sup-priority"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sup-message">Message</Label>
          <Textarea id="sup-message" value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Describe the issue in detail…" rows={5} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={sending} className="gap-2">
            <Send className="w-4 h-4" />
            {sending ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
    </div>
  );
}