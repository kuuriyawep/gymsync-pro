import React, { useEffect, useRef, useState } from "react";
import { Check, X, Calendar } from "lucide-react";
import StreakCard from "@/components/member/StreakCard";
import MemberLayout from "@/components/MemberLayout";
import MemberDataState from "@/components/member/MemberDataState";
import PullToRefresh from "@/components/PullToRefresh";
import { checkInMember, loadMemberPortal, useMemberPortal } from "@/lib/memberPortalStore";
import { attendanceMonth, attendanceSummary } from "@/lib/attendance";
import { formatGymMonth, gymToday } from "@/lib/gymTime";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const card = "rounded-2xl border border-border bg-card p-5";

export default function MemberAttendance() {
  const { data, loaded, error } = useMemberPortal();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInError, setCheckInError] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  // Needed before the early returns so the celebration effect can watch it;
  // the loading and error states below are unchanged.
  const summary = data
    ? attendanceSummary(data.attendance, data.attendanceStartDate)
    : { current: 0, monthCount: 0, week: [], dates: new Set() };
  const streakRef = useRef(summary.current);

  useEffect(() => {
    if (summary.current > streakRef.current) setCelebrate(true);
    streakRef.current = summary.current;
  }, [summary.current]);

  useEffect(() => {
    if (!celebrate) return undefined;
    const timer = setTimeout(() => setCelebrate(false), 2400);
    return () => clearTimeout(timer);
  }, [celebrate]);

  if (!loaded) {
    return (
      <MemberLayout title="Attendance">
        <div className="h-80 bg-muted animate-pulse rounded-xl" />
      </MemberLayout>
    );
  }

  if (!data) {
    return <MemberDataState title="Attendance" error={error} />;
  }

  // "Today" is the gym's calendar day, matching the backend's one-check-in-per-day
  // rule. Using the device clock let a member in another timezone see the button
  // as available right after a successful check-in.
  const todayKey = gymToday();
  const checkedInToday = summary.dates.has(todayKey);

  const handleCheckIn = async () => {
    if (checkingIn || checkedInToday) return;
    setCheckingIn(true);
    setCheckInMessage("");
    setCheckInError("");
    try {
      const result = await checkInMember();
      setCheckInMessage(result?.alreadyCheckedIn ? "You have already checked in today." : "Check-in saved. Your attendance streak has been updated.");
    } catch (err) {
      setCheckInError(err?.message || "Check-in could not be saved. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  const { cells, meta } = attendanceMonth(todayKey);
  const calendarMonthKey = meta.monthKey;

  return (
    <MemberLayout title="Attendance" back="/member">
      <PullToRefresh onRefresh={() => loadMemberPortal(true)} label="Refreshing attendance…">
        <div className="space-y-5">
          <StreakCard days={summary.current} celebrate={celebrate} />

          <div className={`${card} space-y-3`}>
            <div>
              <h3 className="font-semibold">Daily check-in</h3>
              <p className="mt-1 text-sm text-muted-foreground">Record today's gym visit to build your attendance streak.</p>
            </div>
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={checkingIn || checkedInToday}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${checkedInToday ? "cursor-not-allowed border border-border bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"}`}
            >
              {checkingIn ? "Saving check-in…" : checkedInToday ? "Checked in today ✓" : "Check in today"}
            </button>
            {checkInMessage && <p role="status" className="text-sm text-muted-foreground">{checkInMessage}</p>}
            {checkInError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{checkInError}</p>}
          </div>

          <div className={card}>
            <h3 className="mb-3 font-semibold">Last 7 days</h3>
            <div className="flex justify-between gap-1">
              {summary.week.map((item) => (
                <div key={item.key} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{item.day}</p>
                  <div className={`mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-full ${item.attended ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {item.attended ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={card}>
            <h3 className="mb-4 flex gap-2 font-semibold">
              <Calendar className="w-4 h-4" />
              {formatGymMonth(todayKey)}
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => (
                <div key={day} className="text-center text-[10px] text-muted-foreground">{day}</div>
              ))}
              {cells.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} />;
                const key = `${calendarMonthKey}-${String(day).padStart(2, "0")}`;
                const started = data.attendanceStartDate ? String(data.attendanceStartDate).slice(0, 10) : "";
                const tracked = !started || key >= started;
                return (
                  <div
                    key={key}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs ${tracked && summary.dates.has(key) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{summary.monthCount}</p>
            <p className="text-xs text-muted-foreground">Check-ins this month</p>
          </div>
        </div>
      </PullToRefresh>
    </MemberLayout>
  );
}