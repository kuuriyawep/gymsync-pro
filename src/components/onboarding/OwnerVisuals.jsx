import React from "react";
import { Users, CreditCard, Clock, UserX, CalendarCheck } from "lucide-react";

const card = "bg-card border border-border rounded-xl";
const ok = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
const warn = "bg-amber-500/15 text-amber-600 dark:text-amber-400";
const danger = "bg-red-500/15 text-red-600 dark:text-red-400";

// Mimics the existing Owner Dashboard (stat cards + bar chart + expiry cards)
export function DashboardPreview() {
  const bars = [1.8, 2.1, 1.9, 2.4, 2.8, 3.2, 1.4];
  const max = 3.2;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[["Total", "4,829"], ["Active", "4,512"], ["Revenue", "$48K"]].map(([l, v]) => (
          <div key={l} className={`${card} p-3`}>
            <p className="text-base font-bold sm:text-lg">{v}</p>
            <p className="text-[10px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className={`${card} p-4`}>
        <p className="text-xs font-semibold mb-3">Revenue & Members</p>
        <div className="flex items-end justify-between gap-2 h-28">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary rounded-t-md" style={{ height: `${(b / max) * 100}%` }} />
              <span className="text-[9px] text-muted-foreground">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[["Expired", "47", UserX], ["Expiring", "184", CalendarCheck]].map(([l, v, I]) => (
          <div key={l} className={`${card} p-3 flex items-center gap-2`}>
            <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0"><I className="w-3.5 h-3.5" /></div>
            <div><p className="text-base font-bold">{v}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mimics the Owner Payments page
export function PaymentsPreview() {
  const rows = [["Sarah Chen", "$60", "Paid"], ["Marcus Reed", "$150", "Paid"], ["Lena Park", "$60", "Pending"], ["Diego Santos", "$300", "Overdue"]];
  const badge = (s) => (s === "Paid" ? ok : s === "Pending" ? warn : danger);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[["This Month", "$48,250"], ["Pending", "8"], ["Overdue", "3"], ["Total", "$548K"]].map(([l, v]) => (
          <div key={l} className={`${card} p-3`}><p className="text-lg font-bold">{v}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>
        ))}
      </div>
      <div className={`${card} divide-y divide-border`}>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-2 p-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-semibold shrink-0">{r[0].split(" ").map((n) => n[0]).join("")}</div>
              <div className="min-w-0"><p className="text-sm font-medium truncate">{r[0]}</p><p className="text-[10px] text-muted-foreground">{r[1]}</p></div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge(r[2])}`}>{r[2]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mimics the Owner Staff & Access management
export function StaffPreview() {
  const staff = [["Maria Gomez", "Manager", "Active"], ["David Kim", "Front Desk", "Active"], ["Priya Shah", "Cashier", "Invited"]];
  return (
    <div className="space-y-3">
      <div className={`${card} p-4`}>
        <p className="text-xs font-semibold mb-3">Staff & Access</p>
        <div className="space-y-2.5">
          {staff.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shrink-0">{s[0].split(" ").map((n) => n[0]).join("")}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{s[0]}</p><p className="text-[10px] text-muted-foreground">{s[1]}</p></div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${s[2] === "Active" ? ok : "bg-muted text-muted-foreground"}`}>{s[2]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`${card} p-4`}>
        <p className="text-xs font-semibold mb-2">Permissions by role</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">Managers view & manage members. Front Desk checks in members. Cashiers record payments. You control what each role can do.</p>
      </div>
    </div>
  );
}

// Personalized value summary built from the owner's answers
export function ValueSummary({ answers }) {
  const size = answers.memberCount || "your members";
  const methodMap = { paper: "notebooks", sheets: "spreadsheets", whatsapp: "WhatsApp notes", other: "another system", manual: "manual work" };
  const method = methodMap[answers.management] || "spreadsheets and notebooks";
  return (
    <div className="space-y-4">
      <div className="bg-primary text-primary-foreground rounded-2xl p-5">
        <p className="text-lg font-heading font-bold leading-snug">Managing {size} members shouldn't require {method}.</p>
        <p className="text-sm text-primary-foreground/70 mt-2">GymSync brings members, memberships, payments, staff and attendance into one place — so you always know where your gym stands.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[["Members", "Everyone in one list", Users], ["Payments", "Record & balance", CreditCard], ["Expiry", "See who's expiring", Clock], ["Reports", "Understand performance", CalendarCheck]].map(([t, d, I]) => (
          <div key={t} className={`${card} p-3`}>
            <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center mb-2"><I className="w-3.5 h-3.5" /></div>
            <p className="text-sm font-semibold">{t}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}