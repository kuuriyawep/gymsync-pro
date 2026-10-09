import React from "react";
import { UserCog, Plus, Trash2, ChevronRight } from "lucide-react";
import ProfileImage from "@/components/ProfileImage";

export default function StaffAccessPanel({ staff, loading, loadError, onInvite, onOpenStaff, onRevoke }) {
  return <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6">
    <div className="flex items-center justify-between mb-1 gap-3">
      <div className="flex items-center gap-2"><UserCog className="w-5 h-5" /><h3 className="font-semibold text-sm">Staff & Access</h3></div>
      <button onClick={onInvite} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/85"><Plus className="w-4 h-4" /> Invite</button>
    </div>
    <p className="text-xs text-black/50 mb-4">Only staff connected to your gym are shown here. Select a staff member to view or edit their profile.</p>
    {loading ? <div className="h-20 rounded-lg bg-black/5 animate-pulse" /> : loadError ? <div className="p-4 rounded-lg border border-black/10 text-sm"><p>{loadError}</p><button className="mt-2 underline underline-offset-2" onClick={() => window.location.reload()}>Reload page</button></div> : staff.length === 0 ? <div className="py-8 text-center border border-dashed border-black/15 rounded-lg"><p className="text-sm font-medium">No staff yet</p><p className="text-xs text-black/45 mt-1">Invite your first staff member when ready.</p></div> : <div className="space-y-2">
      {staff.map((item) => <div key={item.id} className="flex items-center gap-3 p-3 border border-black/10 rounded-lg hover:border-black/25 transition-colors">
        <button type="button" onClick={() => onOpenStaff(item)} className="flex flex-1 min-w-0 items-center gap-3 text-left rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
          <ProfileImage src={item.avatarUrl} alt={item.name} fallback={item.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()} className="w-10 h-10 text-xs" />
          <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{item.name}</span><span className="block text-xs text-black/50 truncate">{item.email} · {item.lastActive}</span></span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/5 whitespace-nowrap">{item.role}</span>
          <ChevronRight className="w-4 h-4 text-black/35 shrink-0" />
        </button>
        <span className="sm:hidden px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/5 whitespace-nowrap">{item.role}</span>
        <button aria-label={`Remove ${item.name}`} title="Revoke access" onClick={() => onRevoke(item)} className="p-2 rounded-lg text-black/40 hover:text-black hover:bg-black/5 shrink-0"><Trash2 className="w-4 h-4" /></button>
      </div>)}
    </div>}
  </div>;
}
