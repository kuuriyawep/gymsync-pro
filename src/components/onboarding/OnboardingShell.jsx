import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export default function OnboardingShell({ step, total, onBack, children, footer, hideProgress }) {
  const pct = total > 0 ? Math.round(((step + 1) / total) * 100) : 0;
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          {onBack ? (
            <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-accent" aria-label="Back"><ChevronLeft className="w-5 h-5" /></button>
          ) : <div className="w-9" />}
          {!hideProgress ? (
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
          ) : <div className="flex-1" />}
          <span className="text-xs font-medium text-muted-foreground tabular-nums w-8 text-right">{!hideProgress ? `${step + 1}/${total}` : ""}</span>
        </div>
      </header>
      <main className="flex-1 max-w-md mx-auto w-full px-5 py-6 flex flex-col">{children}</main>
      {footer && (
        <div className="sticky bottom-0 bg-background border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-md mx-auto px-5 py-4">{footer}</div>
        </div>
      )}
    </div>
  );
}