const DAY = 86400000;
const atStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const validDate = (value) => value ? new Date(value) : null;
const within = (date, start, end) => date && date >= start && date < end;

function bucketsFor(range) {
  const now = new Date();
  const buckets = [];
  if (range === "7d") {
    const first = atStartOfDay(new Date(now.getTime() - 6 * DAY));
    for (let i = 0; i < 7; i++) { const start = new Date(first.getTime() + i * DAY); buckets.push({ start, end: new Date(start.getTime() + DAY), label: start.toLocaleDateString("en", { weekday: "short" }) }); }
  } else if (range === "30d") {
    const first = atStartOfDay(new Date(now.getTime() - 29 * DAY));
    for (let i = 0; i < 4; i++) {
      const start = new Date(first.getTime() + i * 7 * DAY);
      const end = i === 3 ? new Date(todayOrNow(now).getTime() + DAY) : new Date(start.getTime() + 7 * DAY);
      buckets.push({ start, end, label: `Week ${i + 1}` });
    }
  } else {
    const count = range === "year" ? now.getMonth() + 1 : 6;
    const first = range === "year" ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
    for (let i = 0; i < count; i++) { const start = new Date(first.getFullYear(), first.getMonth() + i, 1); buckets.push({ start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1), label: start.toLocaleDateString("en", { month: "short" }) }); }
  }
  return buckets;
}

function todayOrNow(date) { return atStartOfDay(date); }
function revenueSince(payments, start) { return payments.filter((p) => validDate(p.paidAt) >= start).reduce((sum, p) => sum + Number(p.amount || 0), 0); }

export function buildLiveGymAnalytics(members = [], source = {}, range = "6m") {
  const payments = source.payments || [];
  const memberships = source.memberships || [];
  const plans = source.plans || [];
  const now = new Date();
  const today = atStartOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const active = members.filter((m) => m.status === "Active" && (!m.expiryDate || validDate(m.expiryDate) >= today));
  const expired = members.filter((m) => m.status === "Expired" || (m.expiryDate && validDate(m.expiryDate) < today));
  const expiring = members.filter((m) => { const d = validDate(m.expiryDate); return d && d >= today && d < new Date(today.getTime() + 8 * DAY); });
  const membershipHistory = new Map();
  memberships.forEach((m) => {
    const list = membershipHistory.get(m.memberId) || [];
    list.push(m);
    membershipHistory.set(m.memberId, list);
  });
  const renewedIds = new Set([...membershipHistory].filter(([, list]) => list.length > 1).map(([id]) => id));
  const renewalMembershipIds = new Set();
  membershipHistory.forEach((list) => {
    list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    list.slice(1).forEach((m) => renewalMembershipIds.add(m.id));
  });
  const buckets = bucketsFor(range);
  const series = buckets.map((bucket) => ({
    label: bucket.label,
    revenue: payments.filter((p) => within(validDate(p.paidAt), bucket.start, bucket.end)).reduce((sum, p) => sum + Number(p.amount || 0), 0),
    newMembers: members.filter((m) => within(validDate(m.createdAt || m.registeredDate), bucket.start, bucket.end)).length,
    renewals: memberships.filter((m) => renewalMembershipIds.has(m.id) && within(validDate(m.createdAt), bucket.start, bucket.end)).length,
    expired: memberships.filter((m) => within(validDate(m.endDate), bucket.start, bucket.end) && validDate(m.endDate) < today).length,
  }));
  const planNames = new Map(plans.map((p) => [p.id, p.name]));
  const planCounts = {};
  memberships.filter((m) => m.status === "active" && (!m.endDate || validDate(m.endDate) >= today)).forEach((m) => { const name = planNames.get(m.planId) || "Unknown"; planCounts[name] = (planCounts[name] || 0) + 1; });
  const planPerformance = Object.entries(planCounts).map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count);
  const paid = members.filter((m) => m.paymentStatus === "Paid").length;
  const pending = members.filter((m) => m.paymentStatus === "Pending").length;
  const overdue = members.filter((m) => m.paymentStatus === "Overdue").length;
  return {
    stats: { totalMembers: members.length, activeMembers: active.length, expiringSoon: expiring.length, expired: expired.length, monthlyRevenue: revenueSince(payments, monthStart), activeTrainers: 0 },
    expiry: { expired: expired.length, today: members.filter((m) => m.expiryDate === today.toISOString().slice(0, 10)).length, threeDays: members.filter((m) => { const d = validDate(m.expiryDate); return d && d > today && d <= new Date(today.getTime() + 3 * DAY); }).length, fiveDays: members.filter((m) => { const d = validDate(m.expiryDate); return d && d > today && d <= new Date(today.getTime() + 5 * DAY); }).length },
    series,
    recentActivities: source.recentActivities || [],
    revenue: { daily: revenueSince(payments, today), weekly: revenueSince(payments, new Date(today.getTime() - 6 * DAY)), monthly: revenueSince(payments, monthStart), quarterly: revenueSince(payments, new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)), yearly: revenueSince(payments, new Date(now.getFullYear(), 0, 1)) },
    paymentStatus: [{ name: "Paid", value: paid }, { name: "Pending", value: pending }, { name: "Overdue", value: overdue }],
    members: { total: members.length, active: active.length, newMembers: members.filter((m) => validDate(m.createdAt || m.registeredDate) >= monthStart).length, expired: expired.length },
    planPerformance,
    mostPopularPlan: planPerformance[0]?.plan || "No data",
    renewalRate: members.length ? Math.round((renewedIds.size / members.length) * 100) : 0,
  };
}