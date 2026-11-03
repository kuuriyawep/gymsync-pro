import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function OptionCard({ selected, onClick, icon: Icon, label, description }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"}`}
    >
      {Icon && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-primary-foreground/15" : "bg-muted text-muted-foreground"}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className={`text-xs mt-0.5 ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{description}</p>}
      </div>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${selected ? "bg-primary-foreground text-primary" : "border border-border"}`}>
        {selected && <Check className="w-3.5 h-3.5" />}
      </div>
    </motion.button>
  );
}