import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COMPACT_QUERY = "(max-width: 767px)";

const normalize = (options = []) =>
  options
    .map((option) => (typeof option === "string" || typeof option === "number" ? { value: String(option), label: String(option) } : option))
    .filter((option) => option && option.value !== undefined && option.value !== null && option.value !== "");

function useCompact() {
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(COMPACT_QUERY).matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(COMPACT_QUERY);
    const listener = (event) => setCompact(event.matches);
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    }
    query.addListener(listener);
    return () => query.removeListener(listener);
  }, []);

  return compact;
}

/**
 * Dropdown used in place of a raw <select>.
 *
 * Desktop keeps a Radix select popover; on phones it opens a bottom action
 * sheet with large 48px targets, the way a native picker behaves. Both paths
 * call the same onChange(value) contract, so swapping a <select> for this
 * component never changes the form logic around it.
 */
export default function ActionSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  disabled = false,
  ariaLabel,
  className = "",
  title = "Choose an option",
}) {
  const compact = useCompact();
  const [open, setOpen] = useState(false);
  const items = normalize(options);
  const current = value === undefined || value === null ? "" : String(value);
  const selected = items.find((option) => option.value === current) || null;

  const triggerBase = `flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm outline-none transition-colors focus:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60 ${className}`;

  if (!compact) {
    return (
      <Select value={selected ? current : undefined} onValueChange={(next) => onChange(next)} disabled={disabled}>
        <SelectTrigger aria-label={ariaLabel} className={triggerBase}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value} className="min-h-[40px] rounded-lg py-2">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={triggerBase}
      >
        <span className={`truncate ${selected ? "" : "text-muted-foreground"}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={ariaLabel || title}>
          <button type="button" aria-label="Close" className="absolute inset-0 h-full w-full cursor-default bg-black/50" onClick={() => setOpen(false)} />
          <div
            className="relative w-full max-w-lg rounded-t-3xl border-t border-border bg-popover text-popover-foreground shadow-[0_-12px_40px_rgba(0,0,0,0.28)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">{title}</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul role="listbox" className="max-h-[55vh] overflow-y-auto p-1.5">
              {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No options available</li>}
              {items.map((option) => {
                const active = option.value === current;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm transition-colors ${active ? "bg-accent font-semibold" : "hover:bg-accent"}`}
                    >
                      <span className="truncate">{option.label}</span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}