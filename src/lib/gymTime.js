// GymSync runs on the gym's own calendar — Africa/Mogadishu (UTC+3).
// Date-only values (start_date, end_date, joined_at, paid_at) are calendar days
// in that zone. Building them from toISOString() produced the *UTC* day, so
// between 00:00 and 03:00 local time a new membership started "yesterday" and
// an expiry landed a day early. Everything date-only goes through here.
export const GYM_TIME_ZONE = "Africa/Mogadishu";

export function gymToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GYM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Converts a real timestamp (e.g. attendance check_in_at, notification
// created_at) into the gym's calendar day. The browser's own timezone must
// never decide which day a gym visit belongs to.
export function gymDateKey(value) {
  // null/undefined/"" must not silently become the epoch day.
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GYM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addMonths(dateKey, months) {
  const base = new Date(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(base.getTime())) return dateKey;
  const day = base.getUTCDate();
  base.setUTCDate(1);
  base.setUTCMonth(base.getUTCMonth() + Number(months || 0));
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(day, lastDay));
  return base.toISOString().slice(0, 10);
}

export function addDays(dateKey, days) {
  const base = new Date(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(base.getTime())) return dateKey;
  base.setUTCDate(base.getUTCDate() + Number(days || 0));
  return base.toISOString().slice(0, 10);
}

export function monthKeyOf(dateKey) {
  return String(dateKey || "").slice(0, 7);
}

// Calendar metadata for a gym month, so the attendance calendar can never
// drift from the backend's gym-day boundaries.
export function gymMonthMeta(dateKey = gymToday()) {
  const [year, month] = String(dateKey).slice(0, 7).split("-").map(Number);
  if (!year || !month) return { year: 0, month: 0, firstWeekday: 0, daysInMonth: 0, monthKey: "" };
  const first = new Date(Date.UTC(year, month - 1, 1));
  return {
    year,
    month,
    firstWeekday: first.getUTCDay(),
    daysInMonth: new Date(Date.UTC(year, month, 0)).getUTCDate(),
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
  };
}

export function formatGymMonth(dateKey = gymToday()) {
  const meta = gymMonthMeta(dateKey);
  if (!meta.year) return "";
  return new Date(Date.UTC(meta.year, meta.month - 1, 1)).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function gymWeekdayShort(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" });
}