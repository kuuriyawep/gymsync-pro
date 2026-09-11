const DAY = 86400000;
const localDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
  const dates = new Set(records.map((item) => item.checkedInAt ? localDateKey(item.checkedInAt) : item.date).filter(Boolean));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let current = 0;
  for (let i = 0; i < 366; i++) { const date = localDateKey(new Date(today.getTime() - i * DAY)); if (!dates.has(date)) break; current++; }
  const monthPrefix = localDateKey(today).slice(0, 7);
  const monthCount = [...dates].filter((date) => date.startsWith(monthPrefix)).length;
  const week = Array.from({ length: 7 }, (_, index) => { const date = new Date(today.getTime() - (6 - index) * DAY); const key = localDateKey(date); return { day: date.toLocaleDateString("en", { weekday: "short" }), date: date.toLocaleDateString("en", { day: "numeric", month: "short" }), attended: dates.has(key) }; });
  return { current, monthCount, week, dates };
}