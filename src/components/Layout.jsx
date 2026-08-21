import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Dumbbell, LayoutDashboard, Users, Settings, Bell, Search, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Members", path: "/members", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
              AK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Alex Kovac</p>
              <p className="text-xs text-black/50 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-black/10 h-16 flex items-center px-4 md:px-6 gap-3">
          <button
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Gym selector */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/15 hover:bg-black/5 transition-colors">
            <span className="w-2 h-2 rounded-full bg-black" />
            <span className="text-sm font-semibold hidden sm:inline">All Gyms</span>
            <span className="text-sm font-semibold sm:hidden">Gyms</span>
            <ChevronDown className="w-4 h-4 text-black/50" />
          </button>

          <div className="flex-1" />

          {/* Search (desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 w-64">
            <Search className="w-4 h-4 text-black/40" />
            <input
              placeholder="Search members…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40"
            />
          </div>

          <button className="relative p-2 rounded-lg hover:bg-black/5">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-black ring-2 ring-white" />
          </button>

          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
            AK
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-black/10 flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg flex-1 transition-colors ${
                active ? "text-black" : "text-black/40"
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile slide-over menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">IronHub</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-black/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}