// Client-side CSV export for the Reports page.
// Uses ONLY the already-authorized analytics data from buildLiveGymAnalytics.
// No gym_id is accepted — tenant isolation comes from the existing backend.

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(values) {
  return values.map(escapeCsv).join(",");
}

export function buildReportsCsv(data, label) {
  const generatedDate = new Date().toISOString().slice(0, 10);
  const lines = [];

  // Header / metadata
  lines.push(row(["GymSync Pro — Report Export"]));
  lines.push(row(["Report Period", label || ""]));
  lines.push(row(["Generated", generatedDate]));
  lines.push("");

  // Current snapshot metrics (not limited to the selected chart period)
  lines.push(row(["CURRENT SNAPSHOT — current totals and this month's value"]));
  lines.push(row(["Total Members", data.stats?.totalMembers ?? 0]));
  lines.push(row(["Active Members", data.stats?.activeMembers ?? 0]));
  lines.push(row(["Expiring Soon", data.stats?.expiringSoon ?? 0]));
  lines.push(row(["Expired Members", data.stats?.expired ?? 0]));
  lines.push(row(["Monthly Revenue", data.stats?.monthlyRevenue ?? 0]));
  lines.push(row(["Active Trainers", data.stats?.activeTrainers ?? 0]));
  lines.push("");

  // Rolling-window revenue KPIs are intentionally independent of the selected chart period.
  lines.push(row(["ROLLING REVENUE WINDOWS — independent of selected report period"]));
  const rev = data.revenue || {};
  Object.entries(rev).forEach(([key, value]) => {
    lines.push(row([`${key} Revenue`, value ?? 0]));
  });
  lines.push("");

  // Payment status
  lines.push(row(["MEMBERS BY PAYMENT STATUS — counts are members, not payment transactions"]));
  (data.paymentStatus || []).forEach((item) => {
    lines.push(row([item.name, item.value ?? 0]));
  });
  lines.push("");

  // Member stats
  lines.push(row(["MEMBER STATISTICS"]));
  const mem = data.members || {};
  lines.push(row(["Total", mem.total ?? 0]));
  lines.push(row(["Active", mem.active ?? 0]));
  lines.push(row(["New This Month", mem.newMembers ?? 0]));
  lines.push(row(["Expired", mem.expired ?? 0]));
  lines.push("");

  // Membership insights
  lines.push(row(["MEMBERSHIP INSIGHTS"]));
  lines.push(row(["Most Popular Plan", data.mostPopularPlan ?? "No data"]));
  lines.push(row(["Renewal Rate (%)", data.renewalRate == null ? "N/A — no eligible expired memberships" : data.renewalRate]));
  lines.push("");

  // Plan performance
  lines.push(row(["PLAN PERFORMANCE"]));
  lines.push(row(["Plan", "Active Subscriptions"]));
  (data.planPerformance || []).forEach((item) => {
    lines.push(row([item.plan, item.count ?? 0]));
  });
  lines.push("");

  // Totals for the exact period selected in Reports.
  const series = data.series || [];
  lines.push(row(["SELECTED PERIOD TOTALS — " + (label || "Selected period")]));
  lines.push(row(["Revenue", series.reduce((sum, item) => sum + Number(item.revenue || 0), 0)]));
  lines.push(row(["New Members", series.reduce((sum, item) => sum + Number(item.newMembers || 0), 0)]));
  lines.push(row(["Renewals", series.reduce((sum, item) => sum + Number(item.renewals || 0), 0)]));
  lines.push(row(["Expired Memberships", series.reduce((sum, item) => sum + Number(item.expired || 0), 0)]));
  lines.push("");

  // Time series for the selected range
  lines.push(row(["TIME SERIES — " + (label || "Selected period")]));
  lines.push(row(["Period", "Revenue", "New Members", "Renewals", "Expired"]));
  (data.series || []).forEach((item) => {
    lines.push(row([item.label, item.revenue ?? 0, item.newMembers ?? 0, item.renewals ?? 0, item.expired ?? 0]));
  });

  return "\uFEFF" + lines.join("\r\n");
}

export function downloadReportsCsv(data, label) {
  const csv = buildReportsCsv(data, label);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `gymsync-reports-${date}.csv`;
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