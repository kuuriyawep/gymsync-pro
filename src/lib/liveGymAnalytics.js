const DAY = 86400000;
const atStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
// Supabase date columns arrive as YYYY-MM-DD. Parse those in local time so
// date-only values do not shift to the previous day in UTC+ time zones.
const validDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) {
      const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      if (date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3])) return date;
      return null;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const within = (date, start, end) => date && date >= start && date < end;

function bucketsFor(range) {
  const now = new Date();
  const buckets = [];
  if (range === "7d") {
    const first = atStartOfDay(new Date(now.getTime() - 6 * DAY));
    for (let i = 0; i < 7; i++) { const start = new Date(first.getTime() + i * DAY); buckets.push({ start, end: new Date(start.getTime() + DAY), label: start.toLocaleDateString("en", { weekday: "short" }) }); }
  } else if (range === "30d") {
    const first = atStartOfDay(new Date(now.getTime() - 29 * DAY));
    for (let i = 0; i < 5; i++) {
      const start = new Date(first.getTime() + i * 7 * DAY);
      const end = i === 4 ? new Date(atStartOfDay(now).getTime() + DAY) : new Date(start.getTime() + 7 * DAY);
      if (start < end) buckets.push({ start, end, label: i === 4 ? "Final days" : `Week ${i + 1}` });
    }
  } else {
    const count = range === "year" ? now.getMonth() + 1 : 6;
    const first = range === "year" ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
    for (let i = 0; i < count; i++) { const start = new Date(first.getFullYear(), first.getMonth() + i, 1); buckets.push({ start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1), label: start.toLocaleDateString("en", { month: "short" }) }); }
  }
  return buckets;
}

function revenueSince(payments, start, now = new Date()) {
  return payments.filter((p) => {
    const paidAt = validDate(p.paidAt);
    const amount = Number(p.amount);
    return paidAt && paidAt >= start && paidAt <= now && Number.isFinite(amount) && amount > 0;
  }).reduce((sum, p) => sum + Number(p.amount), 0);
}

export function buildLiveGymAnalytics(members = [], source = {}, range = "6m") {
  const payments = source.payments || [];
  const memberships = source.memberships || [];
  const plans = source.plans || [];
  const trainers = source.trainers || [];
  const now = new Date();
  const today = atStartOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const active = members.filter((m) => m.status === "Active" && (!m.expiryDate || (validDate(m.expiryDate) && validDate(m.expiryDate) >= today)));
  const expired = members.filter((m) => m.status === "Expired" || (m.expiryDate && validDate(m.expiryDate) && validDate(m.expiryDate) < today));
  const expiring = members.filter((m) => { const d = validDate(m.expiryDate); return d && d >= today && d < new Date(today.getTime() + 8 * DAY); });
  const membershipHistory = new Map();
  memberships.forEach((m) => {
    const list = membershipHistory.get(m.memberId) || [];
    list.push(m);
    membershipHistory.set(m.memberId, list);
  });
  const eligibleRenewalIds = new Set();
  const renewedIds = new Set();
  membershipHistory.forEach((list, memberId) => {
    const ordered = [...list].sort((a, b) => new Date(a.createdAt || a.startDate || 0).getTime() - new Date(b.createdAt || b.startDate || 0).getTime());
    if (ordered.some((membership) => membership.endDate && validDate(membership.endDate) < today)) {
      eligibleRenewalIds.add(memberId);
      const latest = ordered[ordered.length - 1];
      if (latest && latest.status === "active" && (!latest.endDate || validDate(latest.endDate) >= today)) renewedIds.add(memberId);
    }
  });
  const renewalMembershipIds = new Set();
  membershipHistory.forEach((list) => {
    list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    list.slice(1).forEach((m) => renewalMembershipIds.add(m.id));
  });
  const buckets = bucketsFor(range);
  const series = buckets.map((bucket) => ({
    label: bucket.label,
    revenue: payments.filter((p) => {
      const paidAt = validDate(p.paidAt);
      const amount = Number(p.amount);
      return within(paidAt, bucket.start, bucket.end) && paidAt <= now && Number.isFinite(amount) && amount > 0;
    }).reduce((sum, p) => sum + Number(p.amount), 0),
    newMembers: members.filter((m) => { const createdAt = validDate(m.createdAt || m.registeredDate); return within(createdAt, bucket.start, bucket.end) && createdAt <= now; }).length,
    renewals: memberships.filter((m) => renewalMembershipIds.has(m.id) && within(validDate(m.createdAt), bucket.start, bucket.end)).length,
    expired: memberships.filter((m) => within(validDate(m.endDate), bucket.start, bucket.end) && validDate(m.endDate) < today).length,
  }));
  const planNames = new Map(plans.map((p) => [p.id, p.name]));
  // Count each currently active member once, using their latest membership record.
  // Old membership rows must not inflate active subscription counts.
  const memberById = new Map(members.map((member) => [member.id, member]));
  const latestMembershipByMember = new Map();
  [...memberships].sort((a, b) => new Date(b.createdAt || b.startDate || 0).getTime() - new Date(a.createdAt || a.startDate || 0).getTime()).forEach((membership) => {
    if (!latestMembershipByMember.has(membership.memberId)) latestMembershipByMember.set(membership.memberId, membership);
  });
  const planCounts = {};
  latestMembershipByMember.forEach((membership, memberId) => {
    const member = memberById.get(memberId);
    const current = membership.status === "active" && (!membership.endDate || validDate(membership.endDate) >= today);
    if (current && member && member.status === "Active" && (!member.expiryDate || validDate(member.expiryDate) >= today)) {
      const name = planNames.get(membership.planId) || "Unknown";
      planCounts[name] = (planCounts[name] || 0) + 1;
    }
  });
  const planPerformance = Object.entries(planCounts).map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count);
  const paid = members.filter((m) => m.paymentStatus === "Paid").length;
  const pending = members.filter((m) => m.paymentStatus === "Pending").length;
  const overdue = members.filter((m) => m.paymentStatus === "Overdue").length;
  return {
    stats: { totalMembers: members.length, activeMembers: active.length, expiringSoon: expiring.length, expired: expired.length, monthlyRevenue: revenueSince(payments, monthStart), activeTrainers: trainers.filter((trainer) => String(trainer.status || "").toLowerCase() === "active").length },
    expiry: { expired: expired.length, today: members.filter((m) => { const d = validDate(m.expiryDate); return d && d.getTime() === today.getTime(); }).length, threeDays: members.filter((m) => { const d = validDate(m.expiryDate); return d && d > today && d <= new Date(today.getTime() + 3 * DAY); }).length, fiveDays: members.filter((m) => { const d = validDate(m.expiryDate); return d && d > today && d <= new Date(today.getTime() + 5 * DAY); }).length },
    series,
    recentActivities: source.recentActivities || [],
    revenue: { daily: revenueSince(payments, today, now), weekly: revenueSince(payments, new Date(today.getTime() - 6 * DAY), now), monthly: revenueSince(payments, monthStart, now), quarterly: revenueSince(payments, new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), now), yearly: revenueSince(payments, new Date(now.getFullYear(), 0, 1), now) },
    paymentStatus: [{ name: "Paid", value: paid }, { name: "Pending", value: pending }, { name: "Overdue", value: overdue }],
    members: { total: members.length, active: active.length, newMembers: members.filter((m) => { const createdAt = validDate(m.createdAt || m.registeredDate); return createdAt && createdAt >= monthStart && createdAt <= now; }).length, expired: expired.length },
    planPerformance,
    mostPopularPlan: planPerformance[0]?.plan || "No data",
    renewalRate: eligibleRenewalIds.size ? Math.round((renewedIds.size / eligibleRenewalIds.size) * 100) : 0,
  };
}