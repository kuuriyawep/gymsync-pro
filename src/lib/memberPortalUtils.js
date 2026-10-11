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
export function attendanceSummary(records = [], startDate = '') {
  // A streak is an attendance streak, not an account-age streak. The backend
  // only returns check-ins from the member's attendance tracking start date.
  // Keep this second boundary client-side as a defense against stale/cached data.
  const startKey = startDate ? dateKey(startDate) : '';
  const dates = new Set(
    records
      .map((item) => dateKey(item.checkedInAt || item.date))
      .filter((key) => key && (!startKey || key >= startKey))
  );
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // A streak remains alive throughout today if the latest check-in was
  // yesterday; it resets only after a full missed calendar day. If the member
  // has already checked in today, count from today as usual.
  const todayKey = dateKey(today);
  const yesterday = new Date(today.getTime() - DAY);
  const yesterdayKey = dateKey(yesterday);
  const firstKey = dates.has(todayKey) ? todayKey : dates.has(yesterdayKey) ? yesterdayKey : '';
  let current = 0;
  if (firstKey) {
    for (let i = 0; i < 366; i++) {
      const date = new Date(`${firstKey}T00:00:00`);
      date.setDate(date.getDate() - i);
      const key = dateKey(date);
      if (startKey && key < startKey) break;
      if (!dates.has(key)) break;
      current++;
    }
  }
  const monthPrefix = todayKey.slice(0, 7);
  const monthCount = [...dates].filter((date) => date.startsWith(monthPrefix)).length;
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * DAY);
    const key = dateKey(date);
    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      date: date.toLocaleDateString("en", { day: "numeric", month: "short" }),
      attended: (!startKey || key >= startKey) && dates.has(key)
    };
  });
  return { current, monthCount, week, dates };
}