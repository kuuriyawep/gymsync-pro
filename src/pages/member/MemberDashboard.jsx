import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import { Flame, CreditCard, CalendarCheck, ArrowRight, Clock, Bell, Check } from "lucide-react";
import { motion } from "framer-motion";
import { memberProfile, memberMembership, memberBalance, memberStreak, memberWeek, memberNotifications, membershipProgress } from "@/lib/memberMockData";

const statusTone = { Active: "bg-black text-white", "Expiring Soon": "bg-black/10 text-black", Expired: "bg-black/5 text-black/50" };

export default function MemberDashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const prog = membershipProgress(memberMembership.startDate, memberMembership.expiryDate);

  if (loading) return <MemberLayout title="Home"><div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-black/5 animate-pulse" />)}</div></MemberLayout>;

  return (
    <MemberLayout>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-black/50">{greeting},</p>
          <h1 className="text-2xl font-heading font-bold tracking-tight">{memberProfile.name}</h1>
        </div>

        {/* Membership status */}
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-black/50">Membership</p>
              <p className="text-lg font-bold">{memberMembership.plan}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone[memberMembership.status]}`}>{memberMembership.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><p className="text-xs text-black/50">Start date</p><p className="text-sm font-semibold">{memberMembership.startDate}</p></div>
            <div><p className="text-xs text-black/50">Expiry date</p><p className="text-sm font-semibold">{memberMembership.expiryDate}</p></div>
          </div>
          <div className="flex items-center justify-between text-xs mb-1.5"><span className="text-black/50">{prog.remaining} days remaining</span><span className="text-black/50">{prog.pct}% used</span></div>
          <div className="h-2 rounded-full bg-black/5 overflow-hidden"><div className="h-full bg-black rounded-full" style={{ width: `${prog.pct}%` }} /></div>
        </div>

        {/* Streak snapshot */}
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Flame className="w-5 h-5" /><h3 className="font-semibold">Daily streak</h3></div>
            <span className="text-sm font-bold">{memberStreak.current} day streak</span>
          </div>
          <div className="flex justify-between">
            {memberWeek.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-black/40">{d.day}</span>
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center"><Check className="w-4 h-4" /></div>
              </div>
            ))}
          </div>
          <Link to="/member/attendance" className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-black/60 hover:text-black">View attendance <ArrowRight className="w-3 h-3" /></Link>
        </div>

        {/* Balance snapshot */}
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><CreditCard className="w-5 h-5" /><h3 className="font-semibold">Payments</h3></div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black text-white">{memberBalance.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xs text-black/50">Price</p><p className="text-sm font-bold">${memberBalance.price}</p></div>
            <div><p className="text-xs text-black/50">Paid</p><p className="text-sm font-bold">${memberBalance.paid}</p></div>
            <div><p className="text-xs text-black/50">Balance</p><p className="text-sm font-bold">${memberBalance.balance}</p></div>
          </div>
          <Link to="/member/payments" className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-black/60 hover:text-black">View payments <ArrowRight className="w-3 h-3" /></Link>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/member/attendance" className="flex flex-col items-center gap-2 bg-white border border-black/10 rounded-xl p-4 hover:border-black/30">
            <CalendarCheck className="w-5 h-5" /><span className="text-xs font-medium">Attendance</span>
          </Link>
          <Link to="/member/feedback" className="flex flex-col items-center gap-2 bg-white border border-black/10 rounded-xl p-4 hover:border-black/30">
            <Bell className="w-5 h-5" /><span className="text-xs font-medium">Feedback</span>
          </Link>
          <Link to="/member/profile" className="flex flex-col items-center gap-2 bg-white border border-black/10 rounded-xl p-4 hover:border-black/30">
            <motion.div whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">{memberProfile.avatar}</motion.div>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>

        {/* Recent notifications */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">Recent</h3>
          <div className="space-y-2">
            {memberNotifications.slice(0, 3).map((n) => (
              <div key={n.id} className="flex items-start gap-3 bg-white border border-black/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0"><Clock className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium leading-tight">{n.title}</p><p className="text-xs text-black/50 mt-0.5">{n.description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}