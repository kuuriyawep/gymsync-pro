import React from "react";
import OptionCard from "@/components/onboarding/OptionCard";

export default function QuestionScreen({ icon: Icon, title, subtitle, options, multi, value, maxSelections, onChange }) {
  const selected = (v) => (multi ? (value || []).includes(v) : value === v);
  const toggle = (v) => {
    if (multi) {
      const arr = value || [];
      if (arr.includes(v)) onChange(arr.filter((x) => x !== v));
      else if (!maxSelections || arr.length < maxSelections) onChange([...arr, v]);
    } else {
      onChange(v);
    }
  };
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-6">
        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mb-4">{Icon && <Icon className="w-6 h-6" />}</div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-black/50 mt-1.5">{subtitle}</p>}
      </div>
      <div className="space-y-2.5">
        {options.map((o) => (
          <OptionCard key={o.value} selected={selected(o.value)} onClick={() => toggle(o.value)} icon={o.icon} label={o.label} description={o.description} />
        ))}
      </div>
      {multi && <p className="text-xs text-black/40 mt-4">{maxSelections ? `Select up to ${maxSelections}.` : "Select all that apply."}</p>}
    </div>
  );
}