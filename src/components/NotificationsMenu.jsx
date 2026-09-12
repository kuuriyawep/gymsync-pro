import React, { useMemo, useState } from "react";
import { Bell, UserX, Clock, UserPlus, DollarSign, UserCog, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNowStrict, format } from "date-fns";
import { useMembers, useGymAnalytics, useMembersLoaded } from "@/lib/memberStore";

const iconFor = { expired: UserX, expiring: Clock, member: UserPlus, payment: DollarSign, trainer: UserCog };
const readStorageKey = "gymsync-read-notifications";

const relativeTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNowStrict(date, { addSuffix: true });
};

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(readStorageKey) || "[]")); }
    catch { return new Set(); }
  });
  const members = useMembers();
  const analytics = useGymAnalytics();
  const loaded = useMembersLoaded();

  const items = useMemo(() => {
    const now = new Date();
    const notifications = [];
    members.forEach((member) => {
      const expiry = member.expiryDate ? new Date(`${member.expiryDate}T23:59:59`) : null;
      if (expiry && !Number.isNaN(expiry.getTime())) {
        const days = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
        if (days < 0 || member.status === "Expired") notifications.push({ id: `expired-${member.id}-${member.expiryDate}`, type: "expired", title: "Membership expired", description: `${member.name}'s membership expired on ${format(expiry, "MMM d")}`, occurredAt: expiry.toISOString() });
        else if (days <= 5) notifications.push({ id: `expiring-${member.id}-${member.expiryDate}`, type: "expiring", title: "Membership expires soon", description: `${member.name}'s membership expires in ${days} ${days === 1 ? "day" : "days"}`, occurredAt: now.toISOString() });
      }
      if (member.createdAt) notifications.push({ id: `member-${member.id}`, type: "member", title: "New member registered", description: `${member.name} joined ${member.gym || "the gym"}`, occurredAt: member.createdAt });
    });
    (analytics.payments || []).forEach((payment) => notifications.push({ id: `payment-${payment.id}`, type: "payment", title: "Payment received", description: `${payment.memberName} paid $${Number(payment.amount || 0).toLocaleString()}${payment.method ? ` (${payment.method.replace(/_/g, " ")})` : ""}`, occurredAt: payment.paidAt }));
    return notifications.filter((item) => item.occurredAt).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)).map((item) => ({ ...item, time: relativeTime(item.occurredAt), read: readIds.has(item.id) }));
  }, [members, analytics.payments, readIds]);

  const saveReadIds = (next) => {
    setReadIds(next);
    localStorage.setItem(readStorageKey, JSON.stringify([...next]));
  };
  const unread = items.filter((item) => !item.read).length;
  const markAll = () => saveReadIds(new Set([...readIds, ...items.map((item) => item.id)]));
  const toggleRead = (id) => {
    const next = new Set(readIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    saveReadIds(next);
  };

  const Row = ({ notification, onClick }) => {
    const Icon = iconFor[notification.type] || Bell;
    return (
      <button onClick={onClick} className="group flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-black/[0.025]">
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
      <button onClick={() => setOpen((value) => !value)} className={`relative rounded-xl p-2 transition-colors ${unread > 0 ? "bg-red-50 text-red-600 hover:bg-red-100" : "hover:bg-black/5"}`} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div initial={{ y: -6 }} animate={{ y: 0 }} exit={{ y: -6 }} className="fixed left-2 right-2 top-[4.5rem] z-40 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-[28rem]">
              <div className="flex h-16 items-center justify-between border-b border-black/10 px-5">
                <h3 className="text-xl font-bold tracking-tight">Notifications</h3>
                <button onClick={markAll} disabled={unread === 0} className="text-sm font-semibold text-black/75 hover:text-black disabled:cursor-default disabled:text-black/35">Mark all read</button>
              </div>
              <div className="max-h-[22rem] overflow-y-auto py-1">
                {!loaded ? <p className="px-5 py-10 text-center text-sm text-black/45">Loading notifications...</p> : items.length === 0 ? <p className="px-5 py-10 text-center text-sm text-black/45">No notifications</p> : items.slice(0, 5).map((notification) => <Row key={notification.id} notification={notification} onClick={() => toggleRead(notification.id)} />)}
              </div>
              <button onClick={() => { setAllOpen(true); setOpen(false); }} className="w-full border-t border-black/10 py-3.5 text-center text-sm font-medium hover:bg-black/[0.025]">View all notifications</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {allOpen && (
          <div className="fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setAllOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute bottom-0 right-0 top-0 flex w-full max-w-sm flex-col bg-white">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 px-5">
                <h3 className="font-semibold">All Notifications</h3>
                <button onClick={() => setAllOpen(false)} className="rounded-lg p-1.5 hover:bg-black/5"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                {items.length === 0 ? <p className="px-5 py-10 text-center text-sm text-black/45">No notifications</p> : items.map((notification) => <Row key={notification.id} notification={notification} onClick={() => toggleRead(notification.id)} />)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}