import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dumbbell, LayoutDashboard, Users, Settings, BarChart3, CreditCard, Ticket, UserCog, Search, ChevronDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationsMenu from "@/components/NotificationsMenu";

const primaryNav = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Members", path: "/members", icon: Users },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

const secondaryNav = [
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Trainers", path: "/trainers", icon: UserCog },
  { label: "Membership", path: "/membership", icon: Ticket },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const renderLink = (item, active, onClick) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-black text-white" : "text-black/70 hover:bg-black/5"}`}
    >
      <item.icon className="w-4.5 h-4.5" strokeWidth={2} />
      {item.label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-white text-black flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-black/10 bg-white sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-black/10">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">IronHub</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {primaryNav.map((item, i) => {
            const active = isActive(item.path);
            return (
              <motion.div key={item.path} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i, duration: 0.25 }} whileHover={{ x: 4 }}>
                {renderLink(item, active)}
              </motion.div>
            );
          })}
          <div className="pt-4 mt-2 border-t border-black/10">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Manage</p>
            {secondaryNav.map((item, i) => {
              const active = isActive(item.path);
              return (
                <motion.div key={item.path} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * (primaryNav.length + i), duration: 0.25 }} whileHover={{ x: 4 }}>
                  {renderLink(item, active)}
                </motion.div>
              );
            })}
          </div>
        </nav>
        <div className="p-4 border-t border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">AK</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Alex Kovac</p>
              <p className="text-xs text-black/50 truncate">Owner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-black/10 h-16 flex items-center px-4 md:px-6 gap-3">
          <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/15 hover:bg-black/5 transition-colors">
            <span className="w-2 h-2 rounded-full bg-black" />
            <span className="text-sm font-semibold">Olympic Gym</span>
            <ChevronDown className="w-4 h-4 text-black/50" />
          </button>
          <div className="flex-1" />
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 w-64">
            <Search className="w-4 h-4 text-black/40" />
            <input placeholder="Search members…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40" />
          </div>
          <NotificationsMenu />
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">AK</div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile bottom nav (primary) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-black/10 flex items-center justify-around h-16 px-2">
        {primaryNav.map((item, i) => {
          const active = isActive(item.path);
          return (
            <motion.div key={item.path} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.25 }} className="flex-1">
              <Link to={item.path} className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${active ? "text-black" : "text-black/40"}`}>
                <motion.div whileTap={{ scale: 0.85 }}>
                  <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Mobile slide-over (all nav) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col">
              <div className="flex items-center justify-between px-5 h-16 border-b border-black/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center"><Dumbbell className="w-4 h-4 text-white" /></div>
                  <span className="font-bold text-lg">IronHub</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Menu</p>
                {primaryNav.map((item) => renderLink(item, isActive(item.path), () => setMobileMenuOpen(false)))}
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Manage</p>
                {secondaryNav.map((item) => renderLink(item, isActive(item.path), () => setMobileMenuOpen(false)))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}