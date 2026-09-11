import React from "react";
import { ChevronRight } from "lucide-react";

export default function SettingsMenu({ sections, onSelect }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSelect(section.id)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left border-b border-black/5 last:border-0 hover:bg-black/[0.03] transition-colors"
        >
          <span className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
            <section.icon className="w-4.5 h-4.5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold">{section.label}</span>
            <span className="block text-xs text-black/50 mt-0.5">{section.desc}</span>
          </span>
          <ChevronRight className="w-4 h-4 text-black/35 shrink-0" />
        </button>
      ))}
    </div>
  );
}