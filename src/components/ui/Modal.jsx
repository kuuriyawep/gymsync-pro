import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Theme-aware sheet: surfaces come from the design tokens, so the same modal
// renders light on the light pages and dark inside a `dark` Layout scope.
export default function Modal({ open, onClose, title, subtitle, icon: Icon, children, footer }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Keyboard-safe: keep the focused field visible without aggressive centering.
  useEffect(() => {
    if (!open) return;
    const el = bodyRef.current;
    if (!el) return;
    const handler = (e) => {
      const t = e.target;
      if (!t) return;
      const fillable = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
      if (!fillable) return;
      setTimeout(() => t.scrollIntoView({ block: "nearest", behavior: "smooth" }), 120);
    };
    el.addEventListener("focusin", handler);
    return () => el.removeEventListener("focusin", handler);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: "tween", duration: 0.2 }} className="relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl border border-border bg-card text-foreground shadow-2xl sm:max-w-md sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {Icon && (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-heading font-semibold">{title}</h3>
                  {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain p-5" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>{children}</div>
            {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}