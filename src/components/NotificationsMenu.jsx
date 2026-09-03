import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, UserX, Clock, UserPlus, RefreshCw, DollarSign, UserCog, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notifications as mockNotifications } from "@/lib/mockData";

const iconFor = { expired: UserX, expiring: Clock, member: UserPlus, renewal: RefreshCw, payment: DollarSign, trainer: UserCog };

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [items, setItems] = useState(mockNotifications);
  const unread = items.filter((n) => !n.read).length;

  const markAll = () => setItems((ns) => ns.map((n) => ({ ...n, read: true })));
  const toggleRead = (id) => setItems((ns) => ns.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));

  const Row = ({ n, onClick }) => {
    const Icon = iconFor[n.type] || Bell;
    return (
      <div onClick={onClick} className={`flex gap-3 px-4 py-3 border-b border-black/5 last:border-0 cursor-pointer hover:bg-black/[0.02] ${n.read ? "" : "bg-black/[0.02]"}`}>
        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium leading-tight">{n.title}</p>
            {!n.read && <span className="w-2 h-2 rounded-full bg-black shrink-0" />}
          </div>
          <p className="text-xs text-black/50 mt-0.5 leading-tight">{n.description}</p>
          <p className="text-xs text-black/40 mt-1">{n.time}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-lg hover:bg-black/5" aria-label="Notifications">
        <Bell className="w-5 h-5" />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-black ring-2 ring-white" />}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-11 z-40 bg-white border border-black/10 rounded-xl shadow-lg w-80 max-w-[calc(100vw-2rem)]">
              <div className="flex items-center justify-between px-4 h-12 border-b border-black/10">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <button onClick={markAll} className="text-xs font-medium text-black/60 hover:text-black flex items-center gap-1"><Check className="w-3 h-3" /> Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-black/40">No notifications</p> :
                  items.slice(0, 5).map((n) => <Row key={n.id} n={n} onClick={() => toggleRead(n.id)} />)}
              </div>
              <button onClick={() => { setAllOpen(true); setOpen(false); }} className="w-full text-center text-xs font-medium py-3 border-t border-black/10 hover:bg-black/5">View all notifications</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {allOpen && (
          <div className="fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setAllOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white flex flex-col">
              <div className="flex items-center justify-between px-5 h-14 border-b border-black/10 shrink-0">
                <h3 className="font-semibold">All Notifications</h3>
                <button onClick={() => setAllOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {items.map((n) => <Row key={n.id} n={n} onClick={() => toggleRead(n.id)} />)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}