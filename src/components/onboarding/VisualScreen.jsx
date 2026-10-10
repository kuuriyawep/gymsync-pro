import React from "react";

/** @param {{ icon?: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; children?: React.ReactNode }} props */
export default function VisualScreen({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-5">
        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mb-4">{Icon && <Icon className="w-6 h-6" />}</div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-black/50 mt-1.5">{subtitle}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}