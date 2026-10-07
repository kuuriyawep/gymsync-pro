const DAY = 86400000;
const dateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value || '').slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
export function membershipProgress(startDate, expiryDate) {
  if (!startDate || !expiryDate) return { remaining: 0, pct: 0 };
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${expiryDate}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const total = Math.max(1, Math.round((end - start) / DAY));
  const elapsed = Math.max(0, Math.round((today - start) / DAY));
  return { remaining: Math.max(0, Math.round((end - today) / DAY)), pct: Math.min(100, Math.round((elapsed / total) * 100)) };
}
export function attendanceSummary(records = []) {
  // Use the member's local calendar date from the timestamp. Reading the UTC
  // date portion directly can shift late-night check-ins into the wrong day.
  const dates = new Set(records.map((item) => dateKey(item.checkedInAt || item.date)).filter(Boolean));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let current = 0;
  for (let i = 0; i < 366; i++) { const date = new Date(today.getTime() - i * DAY); const key = dateKey(date); if (!dates.has(key)) break; current++; }
  const monthPrefix = dateKey(today).slice(0, 7);
  const monthCount = [...dates].filter((date) => date.startsWith(monthPrefix)).length;
  const week = Array.from({ length: 7 }, (_, index) => { const date = new Date(today.getTime() - (6 - index) * DAY); const key = dateKey(date); return { day: date.toLocaleDateString("en", { weekday: "short" }), date: date.toLocaleDateString("en", { day: "numeric", month: "short" }), attended: dates.has(key) }; });
  return { current, monthCount, week, dates };
}