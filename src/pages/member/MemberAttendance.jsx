import React, { useState, useEffect } from "react";
import MemberLayout from "@/components/MemberLayout";
import { Flame, Check, X, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { memberStreak, memberWeek, memberAttendanceCalendar } from "@/lib/memberMockData";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MemberAttendance() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  if (loading) return <MemberLayout title="Attendance" back="/member"><div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-black/5 animate-pulse" />)}</div></MemberLayout>;

  const cal = memberAttendanceCalendar;
  const firstDow = new Date(cal.year, cal.month, 1).getDay();
  const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const stat = (label, value, tone) => (
    <div className="flex-1 bg-white border border-black/10 rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-black/50 mt-0.5">{label}</p>
    </div>
  );

  return (
    <MemberLayout title="Attendance" back="/member">
      <div className="space-y-5">
        {/* Streak hero */}
        <div className="bg-black text-white rounded-2xl p-5 text-center">
          <Flame className="w-8 h-8 mx-auto mb-2" />
          <p className="text-3xl font-bold">{memberStreak.current} day streak</p>
          <p className="text-sm text-white/60 mt-1">Keep it up! You're on a roll.</p>
        </div>

        <div className="flex gap-3">
          {stat("Previous", memberStreak.previous, "text-black")}
          {stat("Best", memberStreak.best, "text-black")}
        </div>

        {/* Weekly view */}
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-3">This week</h3>
          <div className="flex justify-between">
            {memberWeek.map((d) => (
              <div key={d.day + d.date} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-black/40">{d.day}</span>
                <span className="text-[10px] text-black/60">{d.date}</span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${d.status === "attended" ? "bg-black text-white" : "bg-black/5 text-black/40"}`}>
                  {d.status === "attended" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4" />
            <h3 className="font-semibold">{MONTHS[cal.month]} {cal.year}</h3>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DOW.map((d) => <div key={d} className="text-center text-[10px] font-medium text-black/40">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={"b" + i} />;
              const attended = cal.attended.includes(d);
              const missed = cal.missed.includes(d);
              return (
                <div key={d} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${attended ? "bg-black text-white" : missed ? "bg-black/5 text-black/40" : "bg-black/[0.02] text-black/30"}`}>
                  {d}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-black/50">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-black" /> Attended</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-black/5" /> Missed</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-3">
          {stat("Attended", memberStreak.daysAttendedThisMonth, "text-black")}
          {stat("Missed", memberStreak.daysMissedThisMonth, "text-black")}
        </div>

        <p className="text-xs text-black/40 text-center px-4">Attendance is recorded automatically when you check in at the gym. Streaks are calculated by your gym.</p>
      </div>
    </MemberLayout>
  );
}