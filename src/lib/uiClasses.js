// Shared surface + control classes for GymSync's dark theme. Every value
// resolves through the design tokens in src/index.css, so one class renders
// correctly on a light page and inside a `dark` Layout scope (Dashboard,
// Members, Payments, Reports, Settings, Member Details).
//
// The green accent is emerald: emerald-500 for solid actions (paired with
// emerald-950 ink so the label stays readable on the bright button), the
// translucent emerald tints for badges and icons.

export const card = "rounded-2xl border border-border bg-card";
export const cardPad = `${card} p-4 sm:p-5`;
export const sectionLabel = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

export const label = "mb-1.5 block text-xs font-medium text-muted-foreground";
export const input =
  "w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-emerald-400/60";
export const select = `${input} appearance-none pr-9`;
export const textarea = `${input} resize-none`;

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-opacity hover:opacity-90 disabled:opacity-50";
export const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50";
export const iconBtn = "rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
export const linkBtn = "inline-flex items-center gap-1 text-xs font-semibold text-emerald-400";

export const pill = (active) =>
  `shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
  }`;

export const iconTile = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400";
export const fieldIcon = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground";