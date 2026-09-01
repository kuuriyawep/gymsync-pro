import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, footer }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Keyboard-safe: keep the focused field visible above the mobile keyboard.
  useEffect(() => {
    if (!open) return;
    const el = bodyRef.current;
    if (!el) return;
    const handler = (e) => {
      const t = e.target;
      if (!t) return;
      const fillable = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
      if (!fillable) return;
      setTimeout(() => t.scrollIntoView({ block: "center", behavior: "smooth" }), 120);
    };
    el.addEventListener("focusin", handler);
    return () => el.removeEventListener("focusin", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85dvh]">
        <div className="flex items-center justify-between px-5 h-14 border-b border-black/10 shrink-0">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
        </div>
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 overscroll-contain" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-4 border-t border-black/10 shrink-0" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>{footer}</div>}
      </div>
    </div>
  );
}