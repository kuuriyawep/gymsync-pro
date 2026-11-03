import React from "react";
import Layout from "@/components/Layout";
import SupportContactForm from "@/components/SupportContactForm";
import { LifeBuoy, BookOpen, FileText, Video, Code, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const resources = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Detailed references for every feature and setting.",
    links: ["Getting Started Guide", "Member Management", "Payments & Billing", "Reports & Analytics"],
  },
  {
    icon: FileText,
    title: "Guides",
    description: "Step-by-step walkthroughs for common workflows.",
    links: ["Onboarding Your Gym", "Setting Up Plans", "Managing Trainers", "Member Self-Service"],
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Short visual walkthroughs to get you up to speed.",
    links: ["Dashboard Tour", "Adding Members", "Recording Payments", "Reading Reports"],
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Integrate GymSync with your own tools.",
    links: ["Authentication", "Members API", "Webhooks", "Rate Limits"],
  },
];

export default function Support() {
  const { toast } = useToast();
  const openResource = (title) =>
    toast({ title: "Coming soon", description: `${title} is being prepared.`, variant: "default" });

  return (
    <Layout>
      <div className="space-y-6 text-foreground sm:space-y-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary">
            <LifeBuoy className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Support Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">Find documentation, guides, and get technical assistance.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-muted-foreground">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
              </div>
              <ul className="space-y-1">
                {r.links.map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => openResource(l)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <span>{l}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <SupportContactForm />
      </div>
    </Layout>
  );
}