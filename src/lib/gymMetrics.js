// Live, gym-scoped metrics derived purely from the data already loaded through
// the membersData backend function (Supabase members / memberships /
// membership_plans / payments rows). Nothing here is mocked: every number is a
// calculation over real records for the signed-in gym.

const DAY = 86400000;

const atStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Supabase date columns arrive as YYYY-MM-DD. Parse those in local time so a
// date-only value never shifts to the previous day in a UTC+ time zone.
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) {
      const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const between = (value, start, end) => {
  const date = parseDate(value);
  return Boolean(date) && date >= start && date <= end;
};

const total = (rows) => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
const receivedPayments = (payments) => (payments || []).filter((payment) => Number(payment.amount) > 0);

export const money = (value) => `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

export function percentChange(current, previous) {
  if (!Number.isFinite(previous) || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// "1 month" -> month, "3 months" -> quarter, so a plan price reads
// "$15 / month" the way an owner says it out loud.
export function planRate(plan) {
  const months = Number(String(plan?.duration || "").replace(/[^\d]/g, ""));
  if (!months) return "";
  if (months === 1) return "month";
  if (months === 3) return "quarter";
  if (months === 12) return "year";
  return `${months} months`;
}

export function buildPaymentIndex(payments = []) {
  const index = new Map();
  payments.forEach((payment) => {
    if (!payment.memberId) return;
    const list = index.get(payment.memberId) || [];
    list.push(payment);
    index.set(payment.memberId, list);
  });
  return index;
}

// Last thing that actually happened for this member: a payment, a profile
// edit, or the moment they were registered.
export function lastActivityFor(member, paymentIndex) {
  const paid = (paymentIndex.get(member.id) || []).map((payment) => payment.paidAt);
  return [member.updatedAt, member.createdAt, ...paid]
    .map(parseDate)
    .filter(Boolean)
    .sort((a, b) => b - a)[0] || null;
}

export function formatActivity(value) {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return "No activity yet";
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${day} • ${time}`;
}

// A member is "Pending" while an active membership still carries a balance.
export function memberDisplayStatus(member) {
  if (member.status === "Suspended") return "Suspended";
  if (member.status === "Expired") return "Expired";
  if (member.status === "Expiring Soon") return "Expiring Soon";
  if (member.paymentStatus && member.paymentStatus !== "Paid") return "Pending";
  return member.status || "Active";
}

// Revenue for the current month, split into membership payments (tied to a
// membership record) and everything else, plus the month-over-month change and
// a 30-day sparkline.
export function buildRevenueMetrics(payments = []) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(monthStart.getTime() - 1);
  const paid = receivedPayments(payments);
  const thisMonth = paid.filter((payment) => between(payment.paidAt, monthStart, now));
  const lastMonth = paid.filter((payment) => between(payment.paidAt, prevMonthStart, prevMonthEnd));
  const membership = thisMonth.filter((payment) => payment.membershipId);
  const others = thisMonth.filter((payment) => !payment.membershipId);
  const firstDay = atStartOfDay(new Date(now.getTime() - 29 * DAY));
  const sparkline = Array.from({ length: 30 }, (_, index) => {
    const start = new Date(firstDay.getTime() + index * DAY);
    const end = new Date(start.getTime() + DAY - 1);
    return { label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: total(paid.filter((payment) => between(payment.paidAt, start, end))) };
  });
  return {
    total: total(thisMonth),
    membership: total(membership),
    other: total(others),
    change: percentChange(total(thisMonth), total(lastMonth)),
    sparkline,
  };
}

// Revenue chart buckets: daily for 7d / 30d, weekly for 90d.
export function buildRevenueSeries(payments = [], range = "30d") {
  const now = new Date();
  const paid = receivedPayments(payments);
  if (range === "90d") {
    const weeks = 13;
    const firstWeek = atStartOfDay(new Date(now.getTime() - (weeks * 7 - 1) * DAY));
    return Array.from({ length: weeks }, (_, index) => {
      const start = new Date(firstWeek.getTime() + index * 7 * DAY);
      const end = new Date(start.getTime() + 7 * DAY - 1);
      return { label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: total(paid.filter((payment) => between(payment.paidAt, start, end))) };
    });
  }
  const days = range === "7d" ? 7 : 30;
  const firstDay = atStartOfDay(new Date(now.getTime() - (days - 1) * DAY));
  return Array.from({ length: days }, (_, index) => {
    const start = new Date(firstDay.getTime() + index * DAY);
    const end = new Date(start.getTime() + DAY - 1);
    return { label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: total(paid.filter((payment) => between(payment.paidAt, start, end))) };
  });
}

// Current member counts with the same counts measured at the end of last month
// (rebuilt from membership periods, so renewals and expired rows are read from
// their real history rather than guessed).
export function buildMemberMetrics(members = [], memberships = []) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const asOf = new Date(monthStart.getTime() - 1);
  const countBy = (status) => members.filter((member) => member.status === status).length;
  const existingThen = members.filter((member) => {
    const created = parseDate(member.createdAt || member.registeredDate);
    return created && created <= asOf;
  });
  const covering = (memberId) => memberships.filter((membership) => {
    const start = parseDate(membership.startDate);
    const end = parseDate(membership.endDate);
    return membership.memberId === memberId && start && start <= asOf && (!membership.endDate || (end && end >= asOf));
  });
  const activeThen = existingThen.filter((member) => member.status !== "Suspended" && covering(member.id).length > 0).length;
  const expiringThen = existingThen.filter((member) => memberships.some((membership) => {
    const end = parseDate(membership.endDate);
    return membership.memberId === member.id && end && end >= asOf && end <= new Date(asOf.getTime() + 7 * DAY);
  })).length;
  const expiredThen = existingThen.filter((member) => memberships.some((membership) => {
    const end = parseDate(membership.endDate);
    return membership.memberId === member.id && end && end < asOf;
  })).length;
  const pendingThen = existingThen.filter((member) => covering(member.id).some((membership) => Number(membership.amountDue || 0) > Number(membership.amountPaid || 0))).length;
  const active = countBy("Active");
  const expiring = countBy("Expiring Soon");
  const expired = countBy("Expired");
  const pending = members.filter((member) => member.paymentStatus === "Pending").length;
  return {
    total: members.length,
    active,
    expiring,
    expired,
    pending,
    totalChange: percentChange(members.length, existingThen.length),
    activeChange: percentChange(active, activeThen),
    expiringChange: percentChange(expiring, expiringThen),
    expiredChange: percentChange(expired, expiredThen),
    pendingChange: percentChange(pending, pendingThen),
  };
}

// Newest payments with the plan they belong to and whether the membership they
// were applied to is still carrying a balance.
export function buildRecentPayments(payments = [], memberships = [], members = [], limit = 5) {
  const membershipById = new Map(memberships.map((membership) => [membership.id, membership]));
  const planByMember = new Map(members.map((member) => [member.id, member.plan]));
  return [...receivedPayments(payments)]
    .filter((payment) => parseDate(payment.paidAt))
    .sort((a, b) => parseDate(b.paidAt) - parseDate(a.paidAt))
    .slice(0, limit)
    .map((payment) => {
      const membership = payment.membershipId ? membershipById.get(payment.membershipId) : null;
      const outstanding = membership ? Number(membership.amountDue || 0) > Number(membership.amountPaid || 0) : false;
      return {
        id: payment.id,
        memberName: payment.memberName || "Member",
        date: parseDate(payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        plan: planByMember.get(payment.memberId) || "—",
        amount: Number(payment.amount),
        status: outstanding ? "Partial" : "Paid",
      };
    });
}