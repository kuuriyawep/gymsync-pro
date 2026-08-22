// Shared mock data for the IronHub owner frontend (frontend-only / no backend)

export const members = [
  { id: 1, memberId: "GYM-1001", name: "Sarah Chen", phone: "+1 555 0101", plan: "Monthly", fee: 60, status: "Active", expiryDate: "2026-09-15", paymentStatus: "Paid", registeredDate: "2026-06-20", gym: "Downtown Iron" },
  { id: 2, memberId: "GYM-1002", name: "Marcus Reed", phone: "+1 555 0102", plan: "3 Months", fee: 150, status: "Active", expiryDate: "2026-11-20", paymentStatus: "Paid", registeredDate: "2026-05-12", gym: "Westside Fitness" },
  { id: 3, memberId: "GYM-1003", name: "Lena Park", phone: "+1 555 0103", plan: "Monthly", fee: 60, status: "Expiring Soon", expiryDate: "2026-08-25", paymentStatus: "Pending", registeredDate: "2026-07-30", gym: "Riverside Gym" },
  { id: 4, memberId: "GYM-1004", name: "Diego Santos", phone: "+1 555 0104", plan: "6 Months", fee: 300, status: "Expired", expiryDate: "2026-08-10", paymentStatus: "Overdue", registeredDate: "2026-02-10", gym: "Downtown Iron" },
  { id: 5, memberId: "GYM-1005", name: "Aisha Khan", phone: "+1 555 0105", plan: "Monthly", fee: 60, status: "Active", expiryDate: "2026-09-01", paymentStatus: "Paid", registeredDate: "2026-06-01", gym: "Northgate Athletic" },
  { id: 6, memberId: "GYM-1006", name: "Tom Walsh", phone: "+1 555 0106", plan: "3 Months", fee: 150, status: "Suspended", expiryDate: "2026-10-05", paymentStatus: "Pending", registeredDate: "2026-04-18", gym: "Westside Fitness" },
  { id: 7, memberId: "GYM-1007", name: "Nina Costa", phone: "+1 555 0107", plan: "Monthly", fee: 60, status: "Expiring Soon", expiryDate: "2026-08-22", paymentStatus: "Paid", registeredDate: "2026-07-22", gym: "Riverside Gym" },
  { id: 8, memberId: "GYM-1008", name: "Omar Farah", phone: "+1 555 0108", plan: "Monthly", fee: 60, status: "Active", expiryDate: "2026-09-30", paymentStatus: "Paid", registeredDate: "2026-08-01", gym: "Downtown Iron" },
  { id: 9, memberId: "GYM-1009", name: "Grace Lee", phone: "+1 555 0109", plan: "6 Months", fee: 300, status: "Expiring Soon", expiryDate: "2026-08-27", paymentStatus: "Pending", registeredDate: "2026-03-15", gym: "Northgate Athletic" },
  { id: 10, memberId: "GYM-1010", name: "Liam Doyle", phone: "+1 555 0110", plan: "Monthly", fee: 60, status: "Expired", expiryDate: "2026-07-30", paymentStatus: "Overdue", registeredDate: "2026-01-25", gym: "Westside Fitness" },
  { id: 11, memberId: "GYM-1011", name: "Hana Yusuf", phone: "+1 555 0111", plan: "3 Months", fee: 150, status: "Active", expiryDate: "2026-10-18", paymentStatus: "Paid", registeredDate: "2026-07-18", gym: "Riverside Gym" },
  { id: 12, memberId: "GYM-1012", name: "Carlos Mendez", phone: "+1 555 0112", plan: "Monthly", fee: 60, status: "Active", expiryDate: "2026-09-10", paymentStatus: "Paid", registeredDate: "2026-08-10", gym: "Downtown Iron" },
];

export const payments = [
  { id: 1, name: "Sarah Chen", plan: "Monthly", amount: 60, date: "2026-08-20", method: "Card", status: "Paid", reference: "TXN-2001" },
  { id: 2, name: "Marcus Reed", plan: "3 Months", amount: 150, date: "2026-08-18", method: "Mobile Money", status: "Paid", reference: "TXN-2002" },
  { id: 3, name: "Lena Park", plan: "Monthly", amount: 60, date: "2026-08-22", method: "Cash", status: "Pending", reference: "TXN-2003" },
  { id: 4, name: "Diego Santos", plan: "6 Months", amount: 300, date: "2026-08-10", method: "Card", status: "Overdue", reference: "TXN-2004" },
  { id: 5, name: "Aisha Khan", plan: "Monthly", amount: 60, date: "2026-08-15", method: "Mobile Money", status: "Paid", reference: "TXN-2005" },
  { id: 6, name: "Tom Walsh", plan: "3 Months", amount: 150, date: "2026-08-05", method: "Cash", status: "Pending", reference: "TXN-2006" },
  { id: 7, name: "Nina Costa", plan: "Monthly", amount: 60, date: "2026-08-22", method: "Card", status: "Paid", reference: "TXN-2007" },
  { id: 8, name: "Omar Farah", plan: "Monthly", amount: 60, date: "2026-08-21", method: "Mobile Money", status: "Paid", reference: "TXN-2008" },
  { id: 9, name: "Grace Lee", plan: "6 Months", amount: 300, date: "2026-08-12", method: "Cash", status: "Pending", reference: "TXN-2009" },
  { id: 10, name: "Liam Doyle", plan: "Monthly", amount: 60, date: "2026-07-30", method: "Card", status: "Overdue", reference: "TXN-2010" },
  { id: 11, name: "Hana Yusuf", plan: "3 Months", amount: 150, date: "2026-08-19", method: "Mobile Money", status: "Paid", reference: "TXN-2011" },
  { id: 12, name: "Carlos Mendez", plan: "Monthly", amount: 60, date: "2026-08-22", method: "Cash", status: "Paid", reference: "TXN-2012" },
];

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

// Dashboard aggregate headline stats (all gyms)
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
  { id: 1, type: "Registration", text: "Member registered at Downtown Iron", time: "Jun 20, 2026" },
  { id: 2, type: "Membership Change", text: "Plan changed from 3 Months to Monthly", time: "Jun 20, 2026" },
  { id: 3, type: "Payment", text: "Payment recorded · $60 · Mobile Money", time: "May 20, 2026" },
  { id: 4, type: "Payment", text: "Payment recorded · $60 · Cash", time: "Jun 20, 2026" },
  { id: 5, type: "Payment", text: "Payment recorded · $60 · Card", time: "Jul 20, 2026" },
  { id: 6, type: "Renewal", text: "Membership renewed (Monthly)", time: "Aug 20, 2026" },
  { id: 7, type: "Payment", text: "Payment recorded · $60 · Card", time: "Aug 20, 2026" },
];