import React, { useEffect, useState } from "react";
import { Inbox, UserX, Clock, UserPlus, DollarSign, MessageSquare, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

const iconFor = {
  expiry: Clock,
  expired: UserX,
  newMembers: UserPlus,
  payments: DollarSign,
  feedback_response: MessageSquare,
};

const relativeTime = (value) => {
  if (!value) return "Date unavailable";
  // Supabase normally returns ISO timestamps with an explicit timezone. If an
  // older row has a timezone-less timestamp, treat it as UTC rather than the
  // browser's local zone to avoid shifting the displayed event time.
  const raw = String(value).trim();
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const date = new Date(hasZone ? raw : `${raw}Z`);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const delta = date.getTime() - Date.now();
  // Never tell the user an event happened "in 20 hours". Small clock skew is
  // normal; larger future values indicate bad source data and should be shown
  // as a calendar date instead of a false relative time.
  if (delta > 2 * 60 * 1000) {
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  if (delta > 0) return "Just now";
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
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
      const rows = response?.data?.notifications || [];
      setItems(rows.map((item) => ({
        ...item,
        time: relativeTime(item.occurredAt),
      })));
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

  const Row = ({ notification }) => {
    const Icon = iconFor[notification.type] || Inbox;
    return (
      <button
        onClick={() => markOne(notification.id)}
        className="group flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-black/[0.025]"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.055]">
          <Icon className="h-5 w-5" strokeWidth={2} />
          {!notification.read && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" />}
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-5">{notification.title}</span>
              <span className="mt-0.5 block text-sm leading-5 text-black/65">{notification.description}</span>
            </span>
            <span className="shrink-0 pt-0.5 text-xs text-black/45">{notification.time}</span>
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((value) => !value); if (!open) load(); }}
        className={`relative rounded-xl p-2 transition-colors ${unread > 0 ? "bg-black text-white" : "hover:bg-black/5"}`}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Inbox className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -6, opacity: 0 }}
              className="fixed left-2 right-2 top-[4.5rem] z-40 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-[28rem]"
            >
              <div className="flex h-16 items-center justify-between border-b border-black/10 px-5">
                <div className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  <h3 className="text-xl font-bold tracking-tight">Notifications</h3>
                </div>
                <button onClick={markAll} disabled={unread === 0} className="text-sm font-semibold text-black/75 hover:text-black disabled:cursor-default disabled:text-black/35">
                  Mark all read
                </button>
              </div>
              <div className="max-h-[22rem] overflow-y-auto py-1">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-black/45">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : items.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-black/45">No notifications</p>
                ) : (
                  items.slice(0, 5).map((notification) => <Row key={notification.id} notification={notification} />)
                )}
              </div>
              <button
                onClick={() => { setAllOpen(true); setOpen(false); }}
                className="w-full border-t border-black/10 py-3.5 text-center text-sm font-medium hover:bg-black/[0.025]"
              >
                View all notifications
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {allOpen && (
          <div className="fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setAllOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} role="dialog" aria-modal="true" aria-label="All notifications" className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-lg flex-col overflow-hidden border-l border-black/10 bg-white shadow-2xl">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 px-5">
                <div className="flex items-center gap-2"><Inbox className="h-5 w-5" /><h3 className="font-semibold">All Notifications</h3></div>
                <button onClick={() => setAllOpen(false)} className="rounded-lg p-1.5 hover:bg-black/5"><X className="h-5 w-5" /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                {items.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-black/45">No notifications</p>
                ) : (
                  items.map((notification) => <Row key={notification.id} notification={notification} />)
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
