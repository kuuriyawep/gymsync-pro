import { addDays, gymToday } from "./gymTime.js";

const DAY = 86400000;

// Membership progress is measured in gym days. The device clock previously
// decided "today", so a member in another timezone saw an expiry land a day
// early. Both dates are date-only gym values, so they are compared in UTC.
export function membershipProgress(startDate, expiryDate, today = gymToday()) {
  if (!startDate || !expiryDate) return { remaining: 0, pct: 0 };
  const start = new Date(`${String(startDate).slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${String(expiryDate).slice(0, 10)}T00:00:00Z`);
  const now = new Date(`${today}T00:00:00Z`);
  if (![start, end, now].every((date) => Number.isFinite(date.getTime()))) return { remaining: 0, pct: 0 };
  const total = Math.max(1, Math.round((end - start) / DAY));
  const elapsed = Math.max(0, Math.round((now - start) / DAY));
  return { remaining: Math.max(0, Math.round((end - now) / DAY)), pct: Math.min(100, Math.round((elapsed / total) * 100)) };
}

// Re-exported so existing imports keep working; the implementation now lives in
// the pure, unit-tested attendance module.
export { attendanceSummary } from "./attendance.js";

export const nextGymDay = (dateKey, days = 1) => addDays(dateKey, days);