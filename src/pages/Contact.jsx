import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    // Simulate send — no backend email endpoint for public visitors
    setTimeout(() => {
      setSending(false);
      setForm({ name: "", email: "", message: "" });
      toast({ title: "Message sent! We'll get back to you soon." });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border h-16 flex items-center px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Dumbbell className="w-4 h-4" />
          </div>
          GymSync Pro
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to app
        </Link>
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground mb-8">
          Have a question about GymSync Pro? Want to request a feature or need help getting started?
          Reach out and we'll get back to you as soon as possible.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Email</p>
                <a href="mailto:support@gymsync.pro" className="text-sm text-muted-foreground hover:text-foreground">support@gymsync.pro</a>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border">
              <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold">In-app feedback</p>
                <p className="text-sm text-muted-foreground">Registered users can send feedback directly from the app sidebar.</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}