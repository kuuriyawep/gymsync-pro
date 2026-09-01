// Member-side mock data (frontend-only). Separate from owner data so the
// frontend can later swap this for real Supabase/PostgreSQL sources without
// touching owner components. All date math here is a UI placeholder — the
// backend will be the source of truth for prices, balances, streaks and dates.

export const memberProfile = {
  name: "Sarah Chen",
  memberId: "GYM-1001",
  phone: "+1 555 0101",
  email: "sarah.chen@gmail.com",
  gym: "Olympic Gym",
  joinDate: "2026-06-20",
  avatar: "SC",
};

export const memberMembership = {
  plan: "Monthly",
  price: 60,
  startDate: "2026-06-20",
  expiryDate: "2026-09-15",
  status: "Active", // Active | Expiring Soon | Expired
  autoRenew: false,
};

export const memberBalance = {
  price: 60,
  paid: 60,
  balance: 0,
  status: "Paid", // Paid | Partially Paid | Outstanding | Expired | Renewal Due
  renewalDate: "2026-09-15",
};

export const memberPayments = [
  { id: 1, amount: 60, date: "2026-08-20", method: "Card", status: "Paid", reference: "TXN-2001" },
  { id: 2, amount: 60, date: "2026-07-20", method: "Card", status: "Paid", reference: "TXN-1882" },
  { id: 3, amount: 60, date: "2026-06-20", method: "Cash", status: "Paid", reference: "TXN-1760" },
];

export const memberStreak = {
  current: 7,
  previous: 12,
  best: 21,
  daysAttendedThisMonth: 23,
  daysMissedThisMonth: 4,
};

// Last 7 days ending today (2026-09-01, Tuesday)
export const memberWeek = [
  { day: "Wed", date: "Aug 26", status: "attended" },
  { day: "Thu", date: "Aug 27", status: "attended" },
  { day: "Fri", date: "Aug 28", status: "attended" },
  { day: "Sat", date: "Aug 29", status: "attended" },
  { day: "Sun", date: "Aug 30", status: "attended" },
  { day: "Mon", date: "Aug 31", status: "attended" },
  { day: "Tue", date: "Sep 1", status: "attended" },
];

// August 2026 calendar (month index 7)
export const memberAttendanceCalendar = {
  year: 2026,
  month: 7, // 0-indexed (August)
  attended: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 28, 29, 30, 31],
  missed: [7, 8, 21, 22],
};

export const memberRequests = [
  { id: 1, type: "Feedback", title: "Great service this month", body: "Really enjoying the new equipment and the evening class schedule. Keep it up!", status: "Completed", date: "2026-08-15", response: "Thank you so much for the kind words, Sarah!" },
  { id: 2, type: "Complaint", title: "Locker room cleanliness", body: "The locker room near the cardio area could be cleaned more frequently during peak hours.", status: "Under Review", date: "2026-08-22", response: null },
  { id: 3, type: "Feature Request", title: "More evening classes", body: "It would be great to have a 7pm HIIT class on weekdays.", status: "Pending", date: "2026-08-28", response: null },
  { id: 4, type: "Machine Request", title: "New cable crossover machine", body: "Could you add a second cable crossover? It's often busy in the evenings.", status: "Approved", date: "2026-08-10", response: "Approved — a new cable crossover arrives next month." },
  { id: 5, type: "Coach Request", title: "Personal coach for strength", body: "I'd like to request a personal coach focused on strength training twice a week.", status: "Pending", date: "2026-08-30", response: null },
];

export const memberNotifications = [
  { id: 1, type: "expiring", title: "Membership expires soon", description: "Your membership expires in 14 days — renew to keep your streak.", time: "2h ago", read: false },
  { id: 2, type: "payment", title: "Payment received", description: "Your payment of $60 was received. Thank you!", time: "1d ago", read: false },
  { id: 3, type: "request", title: "Request approved", description: "Your machine request for a cable crossover was approved.", time: "3d ago", read: true },
];

// Single source for membership date math (UI placeholder only).
export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
export function membershipProgress(startDate, expiryDate, todayStr = "2026-09-01") {
  const total = Math.max(1, daysBetween(startDate, expiryDate));
  const elapsed = Math.max(0, daysBetween(startDate, todayStr));
  const remaining = Math.max(0, total - elapsed);
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  return { total, elapsed, remaining, pct };
}