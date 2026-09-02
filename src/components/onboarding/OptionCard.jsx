import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function OptionCard({ selected, onClick, icon: Icon, label, description }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${selected ? "border-black bg-black text-white" : "border-black/15 bg-white hover:bg-black/[0.02]"}`}>
      {Icon && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-white/15" : "bg-black/5"}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className={`text-xs mt-0.5 ${selected ? "text-white/60" : "text-black/50"}`}>{description}</p>}
      </div>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${selected ? "bg-white text-black" : "border border-black/20"}`}>
        {selected && <Check className="w-3.5 h-3.5" />}
      </div>
    </motion.button>
  );
}