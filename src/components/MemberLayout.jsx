import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, Home, Flame, CreditCard, MessageSquare, User, Bell, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemberPortal } from "@/lib/memberPortalStore";

const nav = [
  { label: "Home", path: "/member", icon: Home },
  { label: "Attendance", path: "/member/attendance", icon: Flame },
  { label: "Payments", path: "/member/payments", icon: CreditCard },
  { label: "Feedback", path: "/member/feedback", icon: MessageSquare },
  { label: "Profile", path: "/member/profile", icon: User },
];

export default function MemberLayout({ children, title, back }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const { data } = useMemberPortal();
  const memberNotifications = data?.notifications || [];
  const isActive = (path) => location.pathname === path || (path !== "/member" && location.pathname.startsWith(path));
  const unread = memberNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border h-14 flex items-center px-4 gap-3" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {back ? (
          <button onClick={() => navigate(back)} className="p-2 -ml-2 rounded-lg hover:bg-accent"><ChevronLeft className="w-5 h-5" /></button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"><Dumbbell className="w-4 h-4 text-primary-foreground" /></div>
            <span className="font-heading font-bold tracking-tight">GymSync</span>
          </div>
        )}
        <div className="flex-1 min-w-0 text-center">
          {title && <span className="text-sm font-semibold truncate">{title}</span>}
        </div>
        <div className="relative">
          <button onClick={() => setBellOpen((o) => !o)} className="relative p-2 rounded-lg hover:bg-accent" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />}
          </button>
          <AnimatePresence>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-11 z-40 bg-popover border border-border rounded-xl shadow-lg w-80 max-w-[calc(100vw-2rem)]">
                  <div className="px-4 h-11 flex items-center border-b border-border"><h3 className="text-sm font-semibold">Notifications</h3></div>
                  <div className="max-h-80 overflow-y-auto">
                    {memberNotifications.map((n) => (
                      <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 ${n.read ? "" : "bg-muted/50"}`}>
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium leading-tight">{n.title}</p><p className="text-xs text-muted-foreground mt-0.5 leading-tight">{n.description}</p><p className="text-xs text-muted-foreground mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</p></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl w-full mx-auto pb-20">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border flex items-center justify-around h-16 px-1" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {nav.map((item, i) => {
          const active = isActive(item.path);
          return (
            <motion.div key={item.path} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.25 }} className="flex-1">
              <Link to={item.path} className={`flex flex-col items-center justify-center gap-1 py-1.5 min-h-[44px] rounded-lg transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
                <motion.div whileTap={{ scale: 0.85 }}><item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} /></motion.div>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}