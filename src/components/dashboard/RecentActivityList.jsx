import React from "react";
import { Activity, CreditCard, RefreshCw, UserPlus } from "lucide-react";

const iconFor = { member: UserPlus, payment: CreditCard, update: RefreshCw };

const relative = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function RecentActivityList({ activities }) {
  const items = (activities || []).slice(0, 5);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3.5 sm:px-5">
        <h3 className="font-heading font-semibold">Recent Activity</h3>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">No activity yet</p>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => {
            const Icon = iconFor[item.type] || Activity;
            return (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{item.text}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{relative(item.occurredAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}