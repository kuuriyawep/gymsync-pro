import React, { useEffect, useState } from "react";
import { Mailbox, UserX, Clock, UserPlus, DollarSign, MessageSquare, RefreshCw } from "lucide-react";
import { formatDistanceStrict } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import Sheet from "@/components/ui/Sheet";

const RECENT_LIMIT = 6;

const iconFor = {
  expiry: Clock,
  expired: UserX,
  newMembers: UserPlus,
  payments: DollarSign,
  feedback_response: MessageSquare,
};

const relativeTime = (value, clockOffset = 0) => {
  if (!value) return "Date unavailable";
  // Supabase normally returns ISO timestamps with an explicit timezone. If an
  // older row has a timezone-less timestamp, treat it as UTC rather than the
  // browser's local zone to avoid shifting the displayed event time.
  const raw = String(value).trim();
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const date = new Date(hasZone ? raw : `${raw}Z`);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const referenceNow = Date.now() + clockOffset;
  const delta = date.getTime() - referenceNow;
  // Never tell the user an event happened "in 20 hours". Small clock skew is
  // normal; larger future values indicate bad source data and should be shown
  // as a calendar date instead of a false relative time.
  if (delta > 2 * 60 * 1000) {
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  if (delta > 0) return "Just now";
  return formatDistanceStrict(date, new Date(referenceNow), { addSuffix: true });
};

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("recent");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { roles } = useAuth();
  const canViewWorkspaceNotifications = roles.includes("owner") || roles.includes("staff");

  const load = async () => {
    if (!canViewWorkspaceNotifications) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await invokeWithAuth("gymAccess", { operation: "listWorkspaceNotifications" });
      const payload = response?.data || {};
      const rows = payload.notifications || [];
      // Use the server clock so an incorrectly set laptop/phone date cannot
      // turn a recent event into a future-relative timestamp.
      const serverNowMs = payload.serverNow ? new Date(payload.serverNow).getTime() : NaN;
      const offset = Number.isFinite(serverNowMs) ? serverNowMs - Date.now() : 0;
      // Newest first, whatever order the query returned.
      const sorted = [...rows].sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0));
      setItems(sorted.map((item) => ({ ...item, time: relativeTime(item.occurredAt, offset) })));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewWorkspaceNotifications) load();
  }, [canViewWorkspaceNotifications]);

  const unread = items.filter((item) => !item.read).length;

  const markOne = async (id) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    try {
      await invokeWithAuth("gymAccess", { operation: "markNotificationRead", id });
    } catch {
      await load();
    }
  };

  const markAll = async () => {
    if (!unread) return;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await invokeWithAuth("gymAccess", { operation: "markAllNotificationsRead" });
    } catch {
      await load();
    }
  };

  const close = () => {
    setOpen(false);
    setView("recent");
  };

  const visible = view === "recent" ? items.slice(0, RECENT_LIMIT) : items;

  const Row = ({ notification }) => {
    const Icon = iconFor[notification.type] || Mailbox;
    return (
      <button
        onClick={() => markOne(notification.id)}
        className="group flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-accent"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
          <Icon className="h-5 w-5" strokeWidth={2} />
          {!notification.read && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-600 ring-2 ring-card" />}
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-5">{notification.title}</span>
              <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{notification.description}</span>
            </span>
            <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">{notification.time}</span>
          </span>
        </span>
      </button>
    );
  };

  if (!canViewWorkspaceNotifications) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative rounded-xl p-2 transition-colors ${unread > 0 ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Mailbox className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background" />}
      </button>

      <Sheet
        open={open}
        onClose={close}
        title={view === "recent" ? "Notifications" : "All notifications"}
        subtitle={view === "recent" ? "Latest activity from your gym" : `${items.length} total`}
        icon={Mailbox}
        onBack={view === "all" ? () => setView("recent") : undefined}
        headerRight={
          <button
            onClick={markAll}
            disabled={unread === 0}
            className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-50"
          >
            Mark all read
          </button>
        }
        footer={
          view === "recent" && items.length > RECENT_LIMIT ? (
            <button onClick={() => setView("all")} className="w-full rounded-xl py-2 text-sm font-semibold text-primary hover:bg-accent">
              View all {items.length} notifications
            </button>
          ) : null
        }
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No notifications yet</p>
        ) : (
          <div className="-mx-2 space-y-0.5">
            {visible.map((notification) => <Row key={notification.id} notification={notification} />)}
          </div>
        )}
      </Sheet>
    </>
  );
}