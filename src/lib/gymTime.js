// GymSync runs on the gym's own calendar — Africa/Mogadishu (UTC+3).
// Date-only values (start_date, end_date, joined_at, paid_at) are calendar days
// in that zone. Building them from toISOString() produced the *UTC* day, so
// between 00:00 and 03:00 local time a new membership started "yesterday" and
// an expiry landed a day early. Everything date-only goes through here.
const ZONE = "Africa/Mogadishu";

export function gymToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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