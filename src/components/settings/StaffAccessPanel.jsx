import React from "react";
import { UserCog, Plus, Trash2, ChevronRight } from "lucide-react";
import ProfileImage from "@/components/ProfileImage";
import { card, primaryBtn } from "@/lib/uiClasses";

export default function StaffAccessPanel({ staff, loading, loadError, onInvite, onOpenStaff, onRevoke }) {
  return <div className={`${card} p-5 sm:p-6`}>
    <div className="mb-1 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2"><UserCog className="w-5 h-5 text-emerald-400" /><h3 className="font-heading text-sm font-semibold">Staff & Access</h3></div>
      <button onClick={onInvite} className={`${primaryBtn} !px-3 !py-1.5`}><Plus className="w-4 h-4" /> Invite</button>
    </div>
    <p className="mb-4 text-xs text-muted-foreground">Only staff connected to your gym are shown here. Select a staff member to view or edit their profile.</p>
    {loading ? <div className="h-20 animate-pulse rounded-xl bg-accent" /> : loadError ? <div className="rounded-xl border border-border p-4 text-sm"><p>{loadError}</p><button className="mt-2 underline underline-offset-2" onClick={() => window.location.reload()}>Reload page</button></div> : staff.length === 0 ? <div className="rounded-xl border border-dashed border-border py-8 text-center"><p className="text-sm font-medium">No staff yet</p><p className="mt-1 text-xs text-muted-foreground">Invite your first staff member when ready.</p></div> : <div className="space-y-2">
      {staff.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-emerald-400/40">
        <button type="button" onClick={() => onOpenStaff(item)} className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60">
          <ProfileImage src={item.avatarUrl} alt={item.name} fallback={item.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()} className="w-10 h-10 text-xs" />
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.name}</span><span className="block truncate text-xs text-muted-foreground">{item.email} · {item.lastActive}</span></span>
          <span className="hidden whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold sm:inline-flex">{item.role}</span>
          <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
        </button>
        <span className="whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold sm:hidden">{item.role}</span>
        <button aria-label={`Remove ${item.name}`} title="Revoke access" onClick={() => onRevoke(item)} className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
      </div>)}
    </div>}
  </div>;
}