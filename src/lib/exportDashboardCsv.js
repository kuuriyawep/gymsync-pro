// Client-side CSV export for the Dashboard.
// Uses ONLY the already-authorized member data loaded for the current gym.
// No gym_id is accepted — tenant isolation comes from the existing backend.

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildDashboardCsv(members = []) {
  const headers = [
    "Member ID",
    "Name",
    "Phone",
    "Email",
    "Gender",
    "Plan",
    "Status",
    "Fee",
    "Amount Paid",
    "Balance",
    "Payment Status",
    "Start Date",
    "Expiry Date",
    "Registered Date"
  ];
  const rows = members.map((m) => [
    m.memberId || "",
    m.name || "",
    m.phone || "",
    m.email || "",
    m.gender || "",
    m.plan || "",
    m.status || "",
    m.fee ?? "",
    m.amountPaid ?? "",
    m.balance ?? "",
    m.paymentStatus || "",
    m.startDate || "",
    m.expiryDate || "",
    m.registeredDate || ""
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  // UTF-8 BOM so Excel/Sheets detects encoding for Unicode (Somali) names
  return "\uFEFF" + csv;
}

export function downloadDashboardCsv(members = []) {
  const csv = buildDashboardCsv(members);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `gymsync-dashboard-export-${date}.csv`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}