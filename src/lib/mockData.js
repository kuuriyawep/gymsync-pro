// Shared mock data for the IronHub owner frontend (frontend-only / no backend)

export const members = [
  { id: 1, memberId: "GYM-1001", name: "Sarah Chen", phone: "+1 555 0101", email: "sarah.chen@olympicgym.com", plan: "Monthly", fee: 60, status: "Active", startDate: "2026-06-20", expiryDate: "2026-09-15", paymentStatus: "Paid", paymentMethod: "Card", registeredDate: "2026-06-20", gym: "Olympic Gym" },
  { id: 2, memberId: "GYM-1002", name: "Marcus Reed", phone: "+1 555 0102", email: "marcus.reed@olympicgym.com", plan: "3 Months", fee: 150, status: "Active", startDate: "2026-05-12", expiryDate: "2026-11-20", paymentStatus: "Paid", paymentMethod: "Mobile Money", registeredDate: "2026-05-12", gym: "Olympic Gym" },
  { id: 3, memberId: "GYM-1003", name: "Lena Park", phone: "+1 555 0103", email: "lena.park@olympicgym.com", plan: "Monthly", fee: 60, status: "Expiring Soon", startDate: "2026-07-30", expiryDate: "2026-08-25", paymentStatus: "Pending", paymentMethod: "Cash", registeredDate: "2026-07-30", gym: "Olympic Gym" },
  { id: 4, memberId: "GYM-1004", name: "Diego Santos", phone: "+1 555 0104", email: "diego.santos@olympicgym.com", plan: "6 Months", fee: 300, status: "Expired", startDate: "2026-02-10", expiryDate: "2026-08-10", paymentStatus: "Overdue", paymentMethod: "Card", registeredDate: "2026-02-10", gym: "Olympic Gym" },
  { id: 5, memberId: "GYM-1005", name: "Aisha Khan", phone: "+1 555 0105", email: "aisha.khan@olympicgym.com", plan: "Monthly", fee: 60, status: "Active", startDate: "2026-06-01", expiryDate: "2026-09-01", paymentStatus: "Paid", paymentMethod: "Mobile Money", registeredDate: "2026-06-01", gym: "Olympic Gym" },
  { id: 6, memberId: "GYM-1006", name: "Tom Walsh", phone: "+1 555 0106", email: "tom.walsh@olympicgym.com", plan: "3 Months", fee: 150, status: "Suspended", startDate: "2026-04-18", expiryDate: "2026-10-05", paymentStatus: "Pending", paymentMethod: "Cash", registeredDate: "2026-04-18", gym: "Olympic Gym" },
  { id: 7, memberId: "GYM-1007", name: "Nina Costa", phone: "+1 555 0107", email: "nina.costa@olympicgym.com", plan: "Monthly", fee: 60, status: "Expiring Soon", startDate: "2026-07-22", expiryDate: "2026-08-22", paymentStatus: "Paid", paymentMethod: "Card", registeredDate: "2026-07-22", gym: "Olympic Gym" },
  { id: 8, memberId: "GYM-1008", name: "Omar Farah", phone: "+1 555 0108", email: "omar.farah@olympicgym.com", plan: "Monthly", fee: 60, status: "Active", startDate: "2026-08-01", expiryDate: "2026-09-30", paymentStatus: "Paid", paymentMethod: "Mobile Money", registeredDate: "2026-08-01", gym: "Olympic Gym" },
  { id: 9, memberId: "GYM-1009", name: "Grace Lee", phone: "+1 555 0109", email: "grace.lee@olympicgym.com", plan: "6 Months", fee: 300, status: "Expiring Soon", startDate: "2026-03-15", expiryDate: "2026-08-27", paymentStatus: "Pending", paymentMethod: "Cash", registeredDate: "2026-03-15", gym: "Olympic Gym" },
  { id: 10, memberId: "GYM-1010", name: "Liam Doyle", phone: "+1 555 0110", email: "liam.doyle@olympicgym.com", plan: "Monthly", fee: 60, status: "Expired", startDate: "2026-01-25", expiryDate: "2026-07-30", paymentStatus: "Overdue", paymentMethod: "Card", registeredDate: "2026-01-25", gym: "Olympic Gym" },
  { id: 11, memberId: "GYM-1011", name: "Hana Yusuf", phone: "+1 555 0111", email: "hana.yusuf@olympicgym.com", plan: "3 Months", fee: 150, status: "Active", startDate: "2026-07-18", expiryDate: "2026-10-18", paymentStatus: "Paid", paymentMethod: "Mobile Money", registeredDate: "2026-07-18", gym: "Olympic Gym" },
  { id: 12, memberId: "GYM-1012", name: "Carlos Mendez", phone: "+1 555 0112", email: "carlos.mendez@olympicgym.com", plan: "Monthly", fee: 60, status: "Active", startDate: "2026-08-10", expiryDate: "2026-09-10", paymentStatus: "Paid", paymentMethod: "Cash", registeredDate: "2026-08-10", gym: "Olympic Gym" },
];

export const payments = [
  { id: 1, paymentId: "PAY-1001", name: "Sarah Chen", plan: "Monthly", amount: 60, date: "2026-08-20", method: "Card", status: "Paid", reference: "TXN-2001", notes: "Monthly membership dues" },
  { id: 2, paymentId: "PAY-1002", name: "Marcus Reed", plan: "3 Months", amount: 150, date: "2026-08-18", method: "Mobile Money", status: "Paid", reference: "TXN-2002", notes: "Quarterly plan renewal" },
  { id: 3, paymentId: "PAY-1003", name: "Lena Park", plan: "Monthly", amount: 60, date: "2026-08-22", method: "Cash", status: "Pending", reference: "TXN-2003", notes: "Awaiting confirmation" },
  { id: 4, paymentId: "PAY-1004", name: "Diego Santos", plan: "6 Months", amount: 300, date: "2026-08-10", method: "Card", status: "Overdue", reference: "TXN-2004", notes: "Overdue - follow up required" },
  { id: 5, paymentId: "PAY-1005", name: "Aisha Khan", plan: "Monthly", amount: 60, date: "2026-08-15", method: "Mobile Money", status: "Paid", reference: "TXN-2005", notes: "Monthly membership dues" },
  { id: 6, paymentId: "PAY-1006", name: "Tom Walsh", plan: "3 Months", amount: 150, date: "2026-08-05", method: "Cash", status: "Pending", reference: "TXN-2006", notes: "Partial payment pending" },
  { id: 7, paymentId: "PAY-1007", name: "Nina Costa", plan: "Monthly", amount: 60, date: "2026-08-22", method: "Card", status: "Paid", reference: "TXN-2007", notes: "Monthly membership dues" },
  { id: 8, paymentId: "PAY-1008", name: "Omar Farah", plan: "Monthly", amount: 60, date: "2026-08-21", method: "Mobile Money", status: "Paid", reference: "TXN-2008", notes: "Monthly membership dues" },
  { id: 9, paymentId: "PAY-1009", name: "Grace Lee", plan: "6 Months", amount: 300, date: "2026-08-12", method: "Cash", status: "Pending", reference: "TXN-2009", notes: "Awaiting balance" },
  { id: 10, paymentId: "PAY-1010", name: "Liam Doyle", plan: "Monthly", amount: 60, date: "2026-07-30", method: "Card", status: "Refunded", reference: "TXN-2010", notes: "Refunded - membership cancelled" },
  { id: 11, paymentId: "PAY-1011", name: "Hana Yusuf", plan: "3 Months", amount: 150, date: "2026-08-19", method: "Mobile Money", status: "Paid", reference: "TXN-2011", notes: "Quarterly plan renewal" },
  { id: 12, paymentId: "PAY-1012", name: "Carlos Mendez", plan: "Monthly", amount: 60, date: "2026-08-22", method: "Cash", status: "Paid", reference: "TXN-2012", notes: "Monthly membership dues" },
];

export const gymInfo = { name: "Olympic Gym", address: "120 Market St, San Francisco, CA", phone: "+1 555 0100", email: "info@olympicgym.com" };

export const activities = [
  { id: 1, type: "member", text: "New member registered: Carlos Mendez", time: "1h ago" },
  { id: 2, type: "payment", text: "Payment recorded: Omar Farah · $60", time: "3h ago" },
  { id: 3, type: "renewal", text: "Membership renewed: Sarah Chen", time: "5h ago" },
  { id: 4, type: "trainer", text: "Trainer added: Jake Miller", time: "1d ago" },
  { id: 5, type: "payment", text: "Payment recorded: Hana Yusuf · $150", time: "1d ago" },
  { id: 6, type: "renewal", text: "Membership renewed: Aisha Khan", time: "2d ago" },
  { id: 7, type: "member", text: "New member registered: Omar Farah", time: "3d ago" },
];

export const plans = [
  { id: 1, name: "Monthly", price: 60, duration: "1 month", activeMembers: 142, status: "Active" },
  { id: 2, name: "3 Months", price: 150, duration: "3 months", activeMembers: 98, status: "Active" },
  { id: 3, name: "6 Months", price: 300, duration: "6 months", activeMembers: 64, status: "Active" },
  { id: 4, name: "Custom", price: null, duration: "Custom", activeMembers: 12, status: "Active" },
];

// Dashboard analytics: revenue ($K), newMembers, renewals
export const analyticsData = {
  "7d": [
    { label: "Mon", revenue: 1.8, newMembers: 6, renewals: 4 },
    { label: "Tue", revenue: 2.1, newMembers: 8, renewals: 5 },
    { label: "Wed", revenue: 1.9, newMembers: 5, renewals: 3 },
    { label: "Thu", revenue: 2.4, newMembers: 9, renewals: 6 },
    { label: "Fri", revenue: 2.8, newMembers: 11, renewals: 7 },
    { label: "Sat", revenue: 3.2, newMembers: 14, renewals: 8 },
    { label: "Sun", revenue: 1.4, newMembers: 4, renewals: 2 },
  ],
  "30d": [
    { label: "Week 1", revenue: 12.5, newMembers: 38, renewals: 24 },
    { label: "Week 2", revenue: 14.2, newMembers: 42, renewals: 28 },
    { label: "Week 3", revenue: 13.8, newMembers: 35, renewals: 30 },
    { label: "Week 4", revenue: 15.6, newMembers: 47, renewals: 33 },
  ],
  "6m": [
    { label: "Feb", revenue: 35, newMembers: 120, renewals: 80 },
    { label: "Mar", revenue: 38, newMembers: 135, renewals: 92 },
    { label: "Apr", revenue: 36, newMembers: 128, renewals: 88 },
    { label: "May", revenue: 42, newMembers: 150, renewals: 101 },
    { label: "Jun", revenue: 45, newMembers: 162, renewals: 110 },
    { label: "Jul", revenue: 48, newMembers: 178, renewals: 124 },
  ],
  year: [
    { label: "Aug", revenue: 30, newMembers: 110, renewals: 70 },
    { label: "Sep", revenue: 31, newMembers: 118, renewals: 74 },
    { label: "Oct", revenue: 33, newMembers: 125, renewals: 80 },
    { label: "Nov", revenue: 34, newMembers: 130, renewals: 85 },
    { label: "Dec", revenue: 32, newMembers: 122, renewals: 78 },
    { label: "Jan", revenue: 35, newMembers: 134, renewals: 90 },
    { label: "Feb", revenue: 35, newMembers: 120, renewals: 80 },
    { label: "Mar", revenue: 38, newMembers: 135, renewals: 92 },
    { label: "Apr", revenue: 36, newMembers: 128, renewals: 88 },
    { label: "May", revenue: 42, newMembers: 150, renewals: 101 },
    { label: "Jun", revenue: 45, newMembers: 162, renewals: 110 },
    { label: "Jul", revenue: 48, newMembers: 178, renewals: 124 },
  ],
};

// Dashboard aggregate headline stats (your gym)
export const dashboardStats = {
  totalMembers: 4829,
  activeMembers: 4512,
  expiringSoon: 184,
  expired: 47,
  monthlyRevenue: 48250,
  activeTrainers: 86,
};

// Expiry overview counts (aggregate)
export const expiryOverview = {
  expired: 47,
  today: 12,
  threeDays: 38,
  fiveDays: 64,
};

// Payment history + activity for a single member (Member Details)
export const memberPaymentHistory = [
  { id: 1, amount: 60, date: "2026-08-20", method: "Card", status: "Paid", reference: "TXN-2001" },
  { id: 2, amount: 60, date: "2026-07-20", method: "Card", status: "Paid", reference: "TXN-1882" },
  { id: 3, amount: 60, date: "2026-06-20", method: "Cash", status: "Paid", reference: "TXN-1760" },
  { id: 4, amount: 60, date: "2026-05-20", method: "Mobile Money", status: "Paid", reference: "TXN-1641" },
];

export const memberActivity = [
  { id: 1, type: "Registration", text: "Member registered at Olympic Gym", time: "Jun 20, 2026" },
  { id: 2, type: "Membership Change", text: "Plan changed from 3 Months to Monthly", time: "Jun 20, 2026" },
  { id: 3, type: "Payment", text: "Payment recorded · $60 · Mobile Money", time: "May 20, 2026" },
  { id: 4, type: "Payment", text: "Payment recorded · $60 · Cash", time: "Jun 20, 2026" },
  { id: 5, type: "Payment", text: "Payment recorded · $60 · Card", time: "Jul 20, 2026" },
  { id: 6, type: "Renewal", text: "Membership renewed (Monthly)", time: "Aug 20, 2026" },
  { id: 7, type: "Payment", text: "Payment recorded · $60 · Card", time: "Aug 20, 2026" },
];

export const trainers = [
  {
    id: 1, name: "James Miller", phone: "+1 555 0201", email: "james.miller@olympicgym.com", specialization: "Strength Training", assigned: 42, status: "Active", joinDate: "2024-03-15", notes: "Specializes in powerlifting and functional strength coaching.",
    assignedMembers: ["Sarah Chen", "Marcus Reed", "Aisha Khan", "Carlos Mendez"],
    activity: [
      { id: 1, text: "Trained Sarah Chen · Strength session", time: "2h ago" },
      { id: 2, text: "Trained Marcus Reed · Strength session", time: "1d ago" },
      { id: 3, text: "Assigned new member: Carlos Mendez", time: "3d ago" },
    ],
  },
  {
    id: 2, name: "Daniel Carter", phone: "+1 555 0202", email: "daniel.carter@olympicgym.com", specialization: "Cardio & HIIT", assigned: 38, status: "Active", joinDate: "2024-06-01", notes: "Leads high-intensity interval and conditioning classes.",
    assignedMembers: ["Omar Farah", "Grace Lee"],
    activity: [
      { id: 1, text: "Led HIIT class · 18 attendees", time: "6h ago" },
      { id: 2, text: "Trained Omar Farah · Cardio session", time: "2d ago" },
    ],
  },
  {
    id: 3, name: "Sarah Johnson", phone: "+1 555 0203", email: "sarah.johnson@olympicgym.com", specialization: "Yoga & Flexibility", assigned: 35, status: "Active", joinDate: "2024-08-20", notes: "Focuses on mobility, flexibility and recovery.",
    assignedMembers: ["Lena Park", "Nina Costa", "Hana Yusuf"],
    activity: [
      { id: 1, text: "Led Yoga class · 12 attendees", time: "4h ago" },
      { id: 2, text: "Trained Lena Park · Flexibility session", time: "1d ago" },
    ],
  },
  {
    id: 4, name: "Michael Lee", phone: "+1 555 0204", email: "michael.lee@olympicgym.com", specialization: "Personal Training", assigned: 29, status: "Inactive", joinDate: "2024-01-10", notes: "Currently on leave. Available for 1-on-1 sessions when active.",
    assignedMembers: ["Tom Walsh"],
    activity: [
      { id: 1, text: "Trained Tom Walsh · PT session", time: "5d ago" },
      { id: 2, text: "Status changed to Inactive", time: "4d ago" },
    ],
  },
];

export const notifications = [
  { id: 1, type: "expired", title: "Membership expired", description: "Diego Santos's membership has expired", time: "1h ago", read: false },
  { id: 2, type: "expiring", title: "Membership expires soon", description: "Lena Park's membership expires in 5 days", time: "3h ago", read: false },
  { id: 3, type: "member", title: "New member registered", description: "Carlos Mendez joined Olympic Gym", time: "5h ago", read: false },
  { id: 4, type: "renewal", title: "Membership renewed", description: "Sarah Chen renewed their membership", time: "1d ago", read: true },
  { id: 5, type: "payment", title: "Payment recorded", description: "Omar Farah paid $60 (Mobile Money)", time: "1d ago", read: true },
  { id: 6, type: "trainer", title: "New trainer added", description: "Brian Lee joined as CrossFit trainer", time: "2d ago", read: true },
];

export const revenueBreakdown = { daily: 1820, weekly: 12400, monthly: 48250, quarterly: 138000, yearly: 548000 };
export const memberSummary = { newMembers: 178, active: 4512, expired: 47, renewals: 124 };
export const membershipStats = { mostPopularPlan: "Monthly", renewalRate: 78 };
export const expirationTrends = [
  { month: "Feb", expired: 8 }, { month: "Mar", expired: 12 }, { month: "Apr", expired: 9 },
  { month: "May", expired: 14 }, { month: "Jun", expired: 11 }, { month: "Jul", expired: 16 },
];
export const planPerformance = [
  { plan: "Monthly", members: 142, revenue: 8520, share: 58 },
  { plan: "3 Months", members: 98, revenue: 14700, share: 25 },
  { plan: "6 Months", members: 64, revenue: 19200, share: 14 },
  { plan: "Custom", members: 12, revenue: 3600, share: 3 },
];

// Staff & access (Owner side). Staff belong to the owner's gym and are invited
// by the owner — they are not separate gym owners. Frontend-only mock.
export const staffRoles = ["Manager", "Front Desk", "Cashier"];
export const staffPermissions = {
  Manager: { label: "Manager", can: ["View & manage members", "Record payments", "View reports", "Manage trainers"] },
  "Front Desk": { label: "Front Desk", can: ["View members", "Check-in members", "Record payments"] },
  Cashier: { label: "Cashier", can: ["View payments", "Record payments"] },
};
export const staff = [
  { id: 1, name: "Alex Kovac", email: "alex@olympicgym.com", role: "Owner", status: "Active", lastActive: "Active now" },
  { id: 2, name: "Maria Gomez", email: "maria@olympicgym.com", role: "Manager", status: "Active", lastActive: "2h ago" },
  { id: 3, name: "David Kim", email: "david@olympicgym.com", role: "Front Desk", status: "Active", lastActive: "1d ago" },
  { id: 4, name: "Priya Shah", email: "priya@olympicgym.com", role: "Cashier", status: "Invited", lastActive: "—" },
];