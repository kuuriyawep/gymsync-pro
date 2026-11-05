// Notification shaping shared by the owner mailbox and the member bell.
// The API can return the same event more than once (a lifecycle reminder that
// was created by an earlier request, or a retried fetch), so duplicates are
// removed here instead of being rendered twice with a duplicated React key.

function timeOf(item) {
  const raw = item?.occurredAt || item?.createdAt || item?.created_at || item?.date || "";
  const stamp = new Date(raw).getTime();
  return Number.isFinite(stamp) ? stamp : 0;
}

export function notificationContentKey(item) {
  return [item?.type || "", item?.title || "", item?.description || item?.message || ""].join("|");
}

export function normalizeNotifications(rows = []) {
  const seenIds = new Set();
  const seenContent = new Set();
  const items = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row) continue;
    const id = row.id || notificationContentKey(row);
    const content = notificationContentKey(row);
    if (seenIds.has(id) || seenContent.has(content)) continue;
    seenIds.add(id);
    seenContent.add(content);
    items.push({ ...row, id, read: Boolean(row.read ?? row.read_at) });
  }
  return items.sort((a, b) => timeOf(b) - timeOf(a));
}

export function unreadCount(items = []) {
  return (Array.isArray(items) ? items : []).filter((item) => !item.read).length;
}

// Member reminder categories the backend generates (5 days before expiry,
// 1 day before, and on the expiry day). The frontend only labels what the
// backend already produced — it never schedules a reminder itself.
export function reminderStage(title = "") {
  const text = String(title).toLowerCase();
  if (/expires in 5 days/.test(text)) return "5 days before expiry";
  if (/expires tomorrow/.test(text)) return "1 day before expiry";
  if (/expires today/.test(text)) return "Expires today";
  if (/expired/.test(text)) return "Expired";
  return "";
}

export function notificationTimestamp(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const date = new Date(hasZone ? raw : `${raw}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}