// Attendance maths computed in the gym's own calendar (Africa/Mogadishu).
//
// Why the zone matters: the backend records one check-in per gym day and
// stores check_in_at as a timestamp. Deriving days from the device clock made a
// member in another timezone see "not checked in" right after a successful
// check-in, and could split or merge streak days. Every day key below comes
// from gymDateKey/gymToday, never from the browser's local date.
import { addDays, gymDateKey, gymMonthMeta, monthKeyOf, gymToday, gymWeekdayShort } from "./gymTime.js";

const DAY = 86400000;

// A record's gym day: prefer the real timestamp (accurate), fall back to the
// date-only string the API also returns.
export function attendanceDayKey(record) {
  const stamp = record?.checkedInAt || record?.check_in_at || record?.checkedIn || "";
  if (stamp) {
    const key = gymDateKey(stamp);
    if (key) return key;
  }
  const fallback = String(record?.date || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(fallback) ? fallback : "";
}

export function attendanceSummary(records = [], startDate = "", today = gymToday()) {
  // A streak is an attendance streak, not an account-age streak. The backend
  // only returns check-ins from the member's tracking start date; the boundary
  // is re-applied here as a defence against stale/cached data.
  const startKey = startDate ? String(startDate).slice(0, 10) : "";
  const dates = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    const key = attendanceDayKey(record);
    if (!key) continue;
    if (startKey && key < startKey) continue;
    dates.add(key);
  }

  const todayKey = today;
  // A streak survives today until a full gym day is missed: it counts back from
  // today when the member checked in today, otherwise from yesterday.
  const firstKey = dates.has(todayKey) ? todayKey : dates.has(addDays(todayKey, -1)) ? addDays(todayKey, -1) : "";
  let current = 0;
  if (firstKey) {
    for (let i = 0; i < 366; i++) {
      const key = addDays(firstKey, -i);
      if (startKey && key < startKey) break;
      if (!dates.has(key)) break;
      current++;
    }
  }

  const monthPrefix = monthKeyOf(todayKey);
  const monthCount = [...dates].filter((key) => key.startsWith(monthPrefix)).length;

  const week = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(todayKey, index - 6);
    return {
      key,
      day: gymWeekdayShort(key),
      attended: (!startKey || key >= startKey) && dates.has(key),
    };
  });

  return { current, monthCount, week, dates, todayKey };
}

// Calendar cells for one gym month: leading blanks to align the weekday, then
// the real days of that month. Nothing is invented to fill gaps.
export function attendanceMonth(dateKey = gymToday()) {
  const meta = gymMonthMeta(dateKey);
  if (!meta.daysInMonth) return { cells: [], firstKey: "", meta };
  const cells = [
    ...Array.from({ length: meta.firstWeekday }, () => null),
    ...Array.from({ length: meta.daysInMonth }, (_, index) => index + 1),
  ];
  return { cells, firstKey: `${meta.monthKey}-01`, meta };
}

export function longestStreak(records = [], startDate = "") {
  const startKey = startDate ? String(startDate).slice(0, 10) : "";
  const days = [...new Set((Array.isArray(records) ? records : []).map(attendanceDayKey).filter(Boolean))]
    .filter((key) => !startKey || key >= startKey)
    .sort();
  let best = 0;
  let run = 0;
  let previous = "";
  for (const key of days) {
    run = previous && addDays(previous, 1) === key ? run + 1 : 1;
    if (run > best) best = run;
    previous = key;
  }
  return best;
}

export { DAY };