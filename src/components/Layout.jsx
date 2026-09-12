import React, { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutDashboard, Users, Settings, BarChart3, CreditCard, Ticket, UserCog, Search, Menu, X, LogOut, MessageSquare, LifeBuoy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationsMenu from "@/components/NotificationsMenu";
import AppFeedbackModal from "@/components/AppFeedbackModal";
import { useGym } from "@/lib/gymStore";
import { useAuth } from "@/lib/AuthContext";
import { payments, trainers } from "@/lib/mockData";
import { useMembers } from "@/lib/memberStore";
import ProfileImage from "@/components/ProfileImage";

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
  { label: "Feedback", path: "/feedback", icon: MessageSquare },
  { label: "Support", path: "/support", icon: LifeBuoy },
];

const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const gym = useGym();
  const members = useMembers();
  const { logout } = useAuth();
  const [appFeedbackOpen, setAppFeedbackOpen] = useState(false);

  const isActive = (path) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { members: [], payments: [], trainers: [] };
    return {
      members: members.filter((m) => m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q)).slice(0, 4).map((m) => ({ label: m.name, sub: m.memberId, photoUrl: m.photoUrl, to: `/members/${m.id}` })),
      payments: payments.filter((p) => p.name.toLowerCase().includes(q) || p.paymentId.toLowerCase().includes(q)).slice(0, 3).map((p) => ({ label: p.name, sub: `${p.paymentId} · $${p.amount}`, to: "/payments" })),
      trainers: trainers.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 3).map((t) => ({ label: t.name, sub: t.specialization, to: "/trainers" })),
    };
  }, [search, members]);
  const totalResults = results.members.length + results.payments.length + results.trainers.length;

  const renderLink = (item, active, onClick) => (
    <Link key={item.path} to={item.path} onClick={onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-black text-white" : "text-black/70 hover:bg-black/5"}`}>
      <item.icon className="w-4.5 h-4.5" strokeWidth={2} />{item.label}
    </Link>
  );

  const go = (to) => { setSearch(""); setSearchFocus(false); navigate(to); };

  return (
    <div className="min-h-screen bg-white text-black flex">
      <aside className="hidden md:flex flex-col w-64 border-r border-black/10 bg-white sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-black/10">
          <ProfileImage src={gym.logoUrl} alt={gym.isLoading ? "Loading…" : gym.name} fallback={<Dumbbell className="w-5 h-5" />} className="w-10 h-10" shape="rounded" dark />
          <span className="font-heading font-bold text-lg tracking-tight truncate">{gym.isLoading ? "Loading…" : gym.name}</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {primaryNav.map((item, i) => (
            <motion.div key={item.path} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i, duration: 0.25 }} whileHover={{ x: 4 }}>{renderLink(item, isActive(item.path))}</motion.div>
          ))}
          <div className="pt-4 mt-2 border-t border-black/10">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Manage</p>
            {secondaryNav.map((item, i) => (
              <motion.div key={item.path} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * (primaryNav.length + i), duration: 0.25 }} whileHover={{ x: 4 }}>{renderLink(item, isActive(item.path))}</motion.div>
            ))}
          </div>
        </nav>
        <div className="p-4 border-t border-black/10">
          <button onClick={() => navigate("/settings?tab=gym")} className="flex items-center gap-3 w-full rounded-lg text-left hover:bg-black/5" aria-label="Open gym profile"><ProfileImage src={gym.logoUrl} alt={gym.isLoading ? "Loading…" : gym.name} fallback={<Dumbbell className="w-4 h-4" />} className="w-10 h-10" shape="rounded" dark /><div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{gym.isLoading ? "Loading…" : gym.name}</p><p className="text-xs text-black/50 truncate">Gym Profile</p></div></button>
          <button onClick={() => setAppFeedbackOpen(true)} className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-black/60 hover:bg-black/5"><MessageSquare className="w-4 h-4" /> Send feedback</button>
          <button onClick={() => logout()} className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-black/60 hover:bg-black/5"><LogOut className="w-4 h-4" /> Log out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-black/10 h-16 flex items-center px-4 md:px-6 gap-3">
          <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5" onClick={() => setMobileMenuOpen(true)}><Menu className="w-5 h-5" /></button>
          <div className="min-w-0 max-w-[60vw]" aria-label={`Current gym: ${gym.isLoading ? "Loading…" : gym.name}`}>
            <span className="text-sm font-semibold truncate">{gym.isLoading ? "Loading…" : gym.name}</span>
          </div>
          <div className="flex-1" />
          <div className="relative hidden lg:block w-64">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5">
              <Search className="w-4 h-4 text-black/40" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => setSearchFocus(true)} onBlur={() => setTimeout(() => setSearchFocus(false), 150)} placeholder="Search members, payments, trainers…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40" />
            </div>
            <AnimatePresence>
              {searchFocus && search.trim() && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-11 z-40 bg-white border border-black/10 rounded-xl shadow-lg w-80 max-w-[calc(100vw-2rem)]">
                  {totalResults === 0 ? <p className="px-4 py-6 text-center text-sm text-black/40">No results found</p> : (
                    <div className="max-h-80 overflow-y-auto">
                      {results.members.length > 0 && <><p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Members</p>{results.members.map((r) => <button key={r.sub} onMouseDown={() => go(r.to)} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-black/5 text-left"><ProfileImage src={r.photoUrl} alt={r.label} fallback={initials(r.label)} className="w-8 h-8 text-[10px]" /><div><p className="text-sm font-medium">{r.label}</p><p className="text-xs text-black/50">{r.sub}</p></div></button>)}</>}
                      {results.payments.length > 0 && <><p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Payments</p>{results.payments.map((r) => <button key={r.sub} onMouseDown={() => go(r.to)} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-black/5 text-left"><div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center"><CreditCard className="w-3.5 h-3.5" /></div><div><p className="text-sm font-medium">{r.label}</p><p className="text-xs text-black/50">{r.sub}</p></div></button>)}</>}
                      {results.trainers.length > 0 && <><p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Trainers</p>{results.trainers.map((r) => <button key={r.label} onMouseDown={() => go(r.to)} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-black/5 text-left"><div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-semibold">{initials(r.label)}</div><div><p className="text-sm font-medium">{r.label}</p><p className="text-xs text-black/50">{r.sub}</p></div></button>)}</>}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <NotificationsMenu />
          <button onClick={() => navigate("/settings?tab=gym")} className="rounded-xl" aria-label="Open gym profile">
            <ProfileImage src={gym.logoUrl} alt={gym.isLoading ? "Loading…" : gym.name} fallback={<Dumbbell className="w-4 h-4" />} className="w-10 h-10" shape="rounded" dark />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-black/10 flex items-center justify-around h-16 px-2">
        {primaryNav.map((item, i) => {
          const active = isActive(item.path);
          return (
            <motion.div key={item.path} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.25 }} className="flex-1">
              <Link to={item.path} className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${active ? "text-black" : "text-black/40"}`}>
                <motion.div whileTap={{ scale: 0.85 }}><item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} /></motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col">
              <div className="flex items-center justify-between px-5 h-16 border-b border-black/10">
                <div className="flex items-center gap-2"><ProfileImage src={gym.logoUrl} alt={gym.isLoading ? "Loading…" : gym.name} fallback={<Dumbbell className="w-4 h-4" />} className="w-9 h-9" shape="rounded" dark /><span className="font-bold text-lg truncate">{gym.isLoading ? "Loading…" : gym.name}</span></div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Menu</p>
                {primaryNav.map((item) => renderLink(item, isActive(item.path), () => setMobileMenuOpen(false)))}
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-black/40">Manage</p>
                {secondaryNav.map((item) => renderLink(item, isActive(item.path), () => setMobileMenuOpen(false)))}
                <div className="pt-4 mt-2 border-t border-black/10 space-y-1">
                  <button onClick={() => setAppFeedbackOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-black/70 hover:bg-black/5 w-full"><MessageSquare className="w-4.5 h-4.5" /> Send feedback</button>
                  <button onClick={() => logout()} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-black/70 hover:bg-black/5 w-full"><LogOut className="w-4.5 h-4.5" /> Log out</button>
                </div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AppFeedbackModal open={appFeedbackOpen} onClose={() => setAppFeedbackOpen(false)} />
    </div>
  );
}