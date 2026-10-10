import React from "react";

/** @param {{ icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; actionLabel?: string; onAction?: () => void }} props */
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-10 text-center">
      <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
        {Icon && <Icon className="w-7 h-7 text-black/40" />}
      </div>
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="text-sm text-black/50 mt-1">{description}</p>}
      {actionLabel && (
        <button onClick={onAction} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
          {actionLabel}
        </button>
      )}
    </div>
  );
}