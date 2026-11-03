import React, { useState } from "react";
import { Flame, Check, X, Calendar } from "lucide-react";
import MemberLayout from "@/components/MemberLayout";
import MemberDataState from "@/components/member/MemberDataState";
import PullToRefresh from "@/components/PullToRefresh";
import { checkInMember, loadMemberPortal, useMemberPortal } from "@/lib/memberPortalStore";
import { attendanceSummary } from "@/lib/memberPortalUtils";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const card = "rounded-2xl border border-border bg-card p-5";

export default function MemberAttendance() {
  const { data, loaded, error } = useMemberPortal();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInError, setCheckInError] = useState("");

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

  const summary = attendanceSummary(data.attendance, data.attendanceStartDate);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];

  return (
    <MemberLayout title="Attendance" back="/member">
      <PullToRefresh onRefresh={() => loadMemberPortal(true)} label="Refreshing attendance…">
        <div className="space-y-5">
          <div className="rounded-2xl bg-primary p-5 text-center text-primary-foreground">
            <Flame className="w-8 h-8 mx-auto" />
            <p className="mt-2 text-3xl font-bold">{summary.current} day streak</p>
          </div>

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
                <div key={item.date} className="text-center">
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
              {now.toLocaleDateString("en", { month: "long", year: "numeric" })}
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => (
                <div key={day} className="text-center text-[10px] text-muted-foreground">{day}</div>
              ))}
              {cells.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} />;
                const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const tracked = !data.attendanceStartDate || key >= data.attendanceStartDate.slice(0, 10);
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