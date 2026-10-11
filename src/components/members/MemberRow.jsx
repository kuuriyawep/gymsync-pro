import React, { useState } from "react";
import { ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Image } from "@/components/ui/image";
import { formatActivity, memberDisplayStatus, money } from "@/lib/gymMetrics";

const initials = (name) => String(name || "?").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

export default function MemberRow({ member, lastActivity, rate, onOpen, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuItem = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent";

  return (
    <div className="relative flex items-center gap-2 px-4 py-3.5 transition-colors hover:bg-accent/60 sm:gap-3">
      <button onClick={() => onOpen(member)} className="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-semibold">
          {member.photoUrl ? <Image src={member.photoUrl} alt={member.name} className="h-full w-full" fittingType="fill" /> : initials(member.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{member.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{member.phone || "No phone"}</span>
          <span className="mt-0.5 block truncate text-[10px] text-muted-foreground sm:text-[11px]">{formatActivity(lastActivity)}</span>
        </span>
      </button>

      <div className="shrink-0 text-right">
        <p className="max-w-[5.5rem] truncate text-[11px] font-medium sm:max-w-[8rem] sm:text-xs">{member.plan}</p>
        <p className="whitespace-nowrap text-[10px] text-muted-foreground sm:text-[11px]">{money(member.fee)}{rate ? ` / ${rate}` : ""}</p>
      </div>

      <StatusBadge status={memberDisplayStatus(member)} />

      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={`Actions for ${member.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl">
              <button onClick={() => { setMenuOpen(false); onEdit(member); }} className={menuItem}><Pencil className="h-3.5 w-3.5" /> Edit member</button>
              <button onClick={() => { setMenuOpen(false); onDelete(member); }} className={`${menuItem} text-red-400`}><Trash2 className="h-3.5 w-3.5" /> Delete member</button>
            </div>
          </>
        )}
      </div>

      <button onClick={() => onOpen(member)} aria-label={`Open ${member.name}`} className="shrink-0 text-muted-foreground hover:text-foreground">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}