// Client-side PDF export for the Reports page using jsPDF.
// Uses ONLY the already-authorized analytics data from buildLiveGymAnalytics.
import { jsPDF } from "jspdf";

export function downloadReportsPdf(data, label) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const generatedDate = new Date().toISOString().slice(0, 10);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GymSync Pro - Report", margin, y);
  y += 22;

  // Period + generated date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Report Period: " + (label || "-"), margin, y);
  y += 14;
  doc.text("Generated: " + generatedDate, margin, y);
  y += 24;

  // Helper to draw a section header
  const section = function (title) {
    if (y > pageHeight - 60) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 12, contentWidth, 20, "F");
    doc.text(title, margin + 6, y + 2);
    y += 22;
  };

  // Helper to draw a key-value row
  const kv = function (key, value) {
    if (y > pageHeight - 40) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(String(key), margin, y);
    doc.text(String(value), margin + 200, y);
    y += 16;
  };

  // Summary
  section("Summary");
  var s = data.stats || {};
  kv("Total Members", s.totalMembers || 0);
  kv("Active Members", s.activeMembers || 0);
  kv("Expiring Soon", s.expiringSoon || 0);
  kv("Expired Members", s.expired || 0);
  kv("Monthly Revenue", "$" + (s.monthlyRevenue || 0).toLocaleString());
  kv("Active Trainers", s.activeTrainers || 0);
  y += 8;

  // Revenue breakdown
  section("Revenue Breakdown");
  var rev = data.revenue || {};
  Object.keys(rev).forEach(function (key) {
    var cap = key.charAt(0).toUpperCase() + key.slice(1);
    kv(cap + " Revenue", "$" + (rev[key] || 0).toLocaleString());
  });
  y += 8;

  // Payment status
  section("Payment Status");
  (data.paymentStatus || []).forEach(function (item) {
    kv(item.name, item.value || 0);
  });
  y += 8;

  // Membership insights
  section("Membership Insights");
  kv("Most Popular Plan", data.mostPopularPlan || "No data");
  kv("Renewal Rate", (data.renewalRate || 0) + "%");
  y += 8;

  // Plan performance table
  section("Plan Performance");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Plan", margin, y);
  doc.text("Active Subscriptions", margin + 250, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  (data.planPerformance || []).forEach(function (item) {
    if (y > pageHeight - 40) { doc.addPage(); y = margin; }
    doc.text(String(item.plan), margin, y);
    doc.text(String(item.count || 0), margin + 250, y);
    y += 14;
  });
  if ((data.planPerformance || []).length === 0) {
    doc.text("No subscription data", margin, y);
    y += 14;
  }
  y += 8;

  // Time series table
  section("Time Series");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Period", margin, y);
  doc.text("Revenue", margin + 120, y);
  doc.text("New Members", margin + 200, y);
  doc.text("Renewals", margin + 310, y);
  doc.text("Expired", margin + 390, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  (data.series || []).forEach(function (item) {
    if (y > pageHeight - 40) { doc.addPage(); y = margin; }
    doc.text(String(item.label), margin, y);
    doc.text("$" + (item.revenue || 0).toLocaleString(), margin + 120, y);
    doc.text(String(item.newMembers || 0), margin + 200, y);
    doc.text(String(item.renewals || 0), margin + 310, y);
    doc.text(String(item.expired || 0), margin + 390, y);
    y += 14;
  });

  var date = new Date().toISOString().slice(0, 10);
  doc.save("gymsync-reports-" + date + ".pdf");
}