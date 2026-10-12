import React from "react";
import { card, primaryBtn } from "@/lib/uiClasses";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className={`${card} p-10 text-center`}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
        {Icon && <Icon className="h-7 w-7 text-emerald-400" />}
      </div>
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {actionLabel && (
        <button onClick={onAction} className={`${primaryBtn} mt-4`}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}