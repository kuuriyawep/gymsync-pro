const DAY = 86400000;
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
  const dates = new Set(records.map((item) => item.date));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let current = 0;
  for (let i = 0; i < 366; i++) { const date = new Date(today.getTime() - i * DAY).toISOString().slice(0, 10); if (!dates.has(date)) break; current++; }
  const monthPrefix = today.toISOString().slice(0, 7);
  const monthCount = [...dates].filter((date) => date.startsWith(monthPrefix)).length;
  const week = Array.from({ length: 7 }, (_, index) => { const date = new Date(today.getTime() - (6 - index) * DAY); const key = date.toISOString().slice(0, 10); return { day: date.toLocaleDateString("en", { weekday: "short" }), date: date.toLocaleDateString("en", { day: "numeric", month: "short" }), attended: dates.has(key) }; });
  return { current, monthCount, week, dates };
}