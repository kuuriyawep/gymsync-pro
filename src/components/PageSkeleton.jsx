import React from "react";

export default function PageSkeleton({ cards = 4, rows = 6 }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-black/5 animate-pulse" />
          <div className="h-4 w-56 rounded bg-black/5 animate-pulse" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-black/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-black/5 animate-pulse" />
        ))}
      </div>
      <div className="h-10 w-full rounded-lg bg-black/5 animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-black/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}