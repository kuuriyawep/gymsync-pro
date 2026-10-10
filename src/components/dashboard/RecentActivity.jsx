import React from "react";
import { UserPlus, DollarSign, RefreshCw } from "lucide-react";

/** @type {Record<string, React.ComponentType<{ className?: string }>>} */
const icons = { member: UserPlus, payment: DollarSign, update: RefreshCw };

const relative = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/**
 * @param {{ activities: Array<{ id: string, type: string, text: string, occurredAt: string }> }} props
 */
export default function RecentActivity({ activities }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-4 md:p-5">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      {(!activities || activities.length === 0) ? (
        <p className="text-sm text-black/45 py-6 text-center">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 6).map((a) => {
            const Icon = icons[a.type] || RefreshCw;
            return (
              <div key={a.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-tight">{a.text}</p>
                  <p className="text-xs text-black/40 mt-0.5">{relative(a.occurredAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}