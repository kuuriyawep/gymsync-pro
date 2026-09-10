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
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0">
            <LifeBuoy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
            <p className="text-sm text-black/50 mt-1">Find documentation, guides, and get technical assistance.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {resources.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              className="bg-white border border-black/10 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                  <r.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-xs text-black/50">{r.description}</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {r.links.map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => openResource(l)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-black/70 hover:bg-black/5"
                    >
                      <span>{l}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-black/30" />
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