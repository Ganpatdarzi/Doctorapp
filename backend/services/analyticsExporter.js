import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { periodLabel } from "./analyticsService.js";

const money = (n) => `Rs. ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

/* -------------------- CSV -------------------- */

const csvEsc = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const csvRow = (arr) => arr.map(csvEsc).join(",");

const flattenData = (data) => {
  const s = data.stats || {};
  const rows = [];

  const addTable = (title, headers, body) => {
    rows.push(title);
    rows.push(csvRow(headers));
    body.forEach((r) => rows.push(csvRow(r)));
    rows.push("");
  };

  addTable(
    "SUMMARY",
    ["Metric", "Value"],
    [
      ["Total Revenue (Paid)", money(s.totalEarnings)],
      ["Appointments", s.totalAppointments],
      ["Paid Appointments", s.paidAppointments],
      ["Registered Patients", s.totalPatients],
      ["Total Doctors", s.totalDoctors],
      ["Active Doctors", s.activeDoctors],
      ["Completion Rate", `${s.completionRate}%`],
      ["Cancellation Rate", `${s.cancellationRate}%`],
      ["Video Consultation Share", `${s.videoShare}%`],
      ["Online Payment Share", `${s.onlinePaymentShare}%`],
      ["Average Appointments / Day", s.avgDaily],
      ["Average Revenue / Day", money(s.avgDailyRevenue)],
      ["Peak Booking Hour", `${s.peakHour} (${s.peakHourCount} bookings)`],
      ["Peak Booking Day", `${s.peakDay} (${s.peakDayCount} bookings)`],
    ]
  );

  addTable(
    "REVENUE BY MONTH",
    ["Month", "Appointments", "Revenue"],
    data.monthly.map((m) => [m.label, m.count, m.revenue])
  );

  addTable(
    "APPOINTMENT TREND (DAILY)",
    ["Date", "Appointments", "Revenue"],
    data.daily.map((d) => [d.label, d.count, d.revenue])
  );

  addTable(
    "APPOINTMENT TREND (WEEKLY)",
    ["Week", "Appointments", "Revenue"],
    data.weekly.map((w) => [w.label, w.count, w.revenue])
  );

  addTable(
    "PATIENT GROWTH",
    ["Month", "New Patients", "Total Patients"],
    data.patientGrowth.map((p) => [p.label, p.new, p.total])
  );

  addTable(
    "DOCTOR PERFORMANCE",
    ["Doctor", "Specialization", "Total", "Completed", "Confirmed", "Pending", "Cancelled", "Rejected", "Revenue", "Completion Rate"],
    data.doctorPerformance.map((d) => [
      d.name,
      d.specialization,
      d.total,
      d.completed,
      d.confirmed,
      d.pending,
      d.cancelled,
      d.rejected,
      d.revenue,
      `${d.completionRate}%`,
    ])
  );

  addTable(
    "MOST BOOKED DOCTORS",
    ["Doctor", "Specialization", "Appointments", "Revenue"],
    data.mostBookedDoctors.map((d) => [d.name, d.specialization, d.total, d.revenue])
  );

  addTable(
    "TOP SPECIALIZATIONS",
    ["Specialization", "Appointments", "Revenue", "Doctors"],
    data.topSpecializations.map((t) => [t.name, t.count, t.revenue, t.doctorCount])
  );

  addTable(
    "PEAK BOOKING HOURS",
    ["Hour", "Appointments", "Revenue"],
    data.peakHours.filter((h) => h.count > 0).map((h) => [h.label, h.count, h.revenue])
  );

  return rows;
};

export const buildCsv = (data) => {
  const header = [
    `Analytics Report`,
    `Period,${periodLabel(data.period)}`,
    `Date Range,${data.from} to ${data.to}`,
    `Generated,${new Date(data.generatedAt).toLocaleString()}`,
    "",
  ].join("\n");
  return header + flattenData(data).join("\n");
};

/* -------------------- Excel -------------------- */

const SHEET_STYLE = {
  title: { bold: true, size: 14, color: { argb: "FF0B3D5C" } },
  header: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
  headerFill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF0077B6" } },
  zebra: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F7FB" } },
  border: {
    top: { style: "thin", color: { argb: "FFDDE5EC" } },
    left: { style: "thin", color: { argb: "FFDDE5EC" } },
    bottom: { style: "thin", color: { argb: "FFDDE5EC" } },
    right: { style: "thin", color: { argb: "FFDDE5EC" } },
  },
};

const addSheet = ({ wb, name, title, subtitle, headers, rows, moneyCols = [], widthMap = {} }) => {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 3 }] });
  ws.mergeCells(1, 1, 1, headers.length);
  ws.getCell(1, 1).value = title;
  ws.getCell(1, 1).font = SHEET_STYLE.title;
  ws.getRow(1).height = 24;
  ws.getRow(1).alignment = { vertical: "middle" };

  if (subtitle) {
    ws.mergeCells(2, 1, 2, headers.length);
    ws.getCell(2, 1).value = subtitle;
    ws.getCell(2, 1).font = { italic: true, size: 10, color: { argb: "FF667788" } };
    ws.getRow(2).height = 18;
  }

  const headerRow = ws.getRow(3);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = SHEET_STYLE.header;
    cell.fill = SHEET_STYLE.headerFill;
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = SHEET_STYLE.border;
  });
  headerRow.height = 20;

  rows.forEach((r, idx) => {
    const row = ws.addRow(r);
    row.eachCell((cell, colNumber) => {
      cell.border = SHEET_STYLE.border;
      cell.alignment = { vertical: "middle", horizontal: moneyCols.includes(colNumber) ? "right" : "left" };
      if (idx % 2 === 1) cell.fill = SHEET_STYLE.zebra;
      if (moneyCols.includes(colNumber)) cell.numFmt = '"Rs. "#,##0';
    });
    row.height = 18;
  });

  headers.forEach((h, i) => {
    ws.getColumn(i + 1).width = widthMap[i + 1] || Math.max(16, h.length + 6);
  });

  return ws;
};

export const buildWorkbook = (data) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Doctor Appointment System";
  wb.created = new Date(data.generatedAt);
  wb.modified = new Date();
  const s = data.stats || {};

  addSheet({
    wb,
    name: "Summary",
    title: "Analytics Report",
    subtitle: `Period: ${periodLabel(data.period)} • ${data.from} to ${data.to}`,
    headers: ["Metric", "Value"],
    rows: [
      ["Total Revenue (Paid)", s.totalEarnings],
      ["Appointments", s.totalAppointments],
      ["Paid Appointments", s.paidAppointments],
      ["Registered Patients", s.totalPatients],
      ["Total Doctors", s.totalDoctors],
      ["Active Doctors", s.activeDoctors],
      ["Completion Rate", `${s.completionRate}%`],
      ["Cancellation Rate", `${s.cancellationRate}%`],
      ["Video Consultation Share", `${s.videoShare}%`],
      ["Online Payment Share", `${s.onlinePaymentShare}%`],
      ["Average Appointments / Day", s.avgDaily],
      ["Average Revenue / Day", s.avgDailyRevenue],
      ["Peak Booking Hour", `${s.peakHour} (${s.peakHourCount})`],
      ["Peak Booking Day", `${s.peakDay} (${s.peakDayCount})`],
    ],
    moneyCols: [2],
    widthMap: { 1: 34, 2: 26 },
  });

  addSheet({
    wb,
    name: "Revenue",
    title: "Revenue Analysis",
    subtitle: periodLabel(data.period),
    headers: ["Month", "Appointments", "Revenue"],
    rows: data.monthly.map((m) => [m.label, m.count, m.revenue]),
    moneyCols: [3],
  });

  if (data.revenueByStatus.length > 0) {
    addSheet({
      wb,
      name: "Revenue by Status",
      title: "Revenue by Appointment Status",
      headers: ["Status", "Revenue"],
      rows: data.revenueByStatus.map((r) => [r.status, r.revenue]),
      moneyCols: [2],
    });
  }

  addSheet({
    wb,
    name: "Revenue by Type",
    title: "Revenue by Consultation Type",
    headers: ["Type", "Revenue"],
    rows: data.revenueByType.map((r) => [r.name, r.value]),
    moneyCols: [2],
  });

  addSheet({
    wb,
    name: "Appointment Trends",
    title: "Appointment Trends",
    subtitle: "Daily counts",
    headers: ["Date", "Appointments", "Revenue"],
    rows: data.daily.map((d) => [d.label, d.count, d.revenue]),
    moneyCols: [3],
  });

  addSheet({
    wb,
    name: "Patient Growth",
    title: "Patient Growth",
    headers: ["Month", "New Patients", "Total Patients"],
    rows: data.patientGrowth.map((p) => [p.label, p.new, p.total]),
  });

  addSheet({
    wb,
    name: "Doctor Performance",
    title: "Doctor Performance",
    headers: ["Doctor", "Specialization", "Total", "Completed", "Confirmed", "Pending", "Cancelled", "Rejected", "Revenue", "Completion Rate"],
    rows: data.doctorPerformance.map((d) => [
      d.name,
      d.specialization,
      d.total,
      d.completed,
      d.confirmed,
      d.pending,
      d.cancelled,
      d.rejected,
      d.revenue,
      `${d.completionRate}%`,
    ]),
    moneyCols: [9],
  });

  addSheet({
    wb,
    name: "Most Booked Doctors",
    title: "Most Booked Doctors",
    headers: ["Doctor", "Specialization", "Appointments", "Revenue"],
    rows: data.mostBookedDoctors.map((d) => [d.name, d.specialization, d.total, d.revenue]),
    moneyCols: [4],
  });

  addSheet({
    wb,
    name: "Specializations",
    title: "Top Specializations",
    headers: ["Specialization", "Appointments", "Revenue", "Doctors"],
    rows: data.topSpecializations.map((t) => [t.name, t.count, t.revenue, t.doctorCount]),
    moneyCols: [3],
  });

  addSheet({
    wb,
    name: "Peak Hours",
    title: "Peak Booking Hours",
    headers: ["Hour", "Appointments", "Revenue"],
    rows: data.peakHours.filter((h) => h.count > 0).map((h) => [h.label, h.count, h.revenue]),
    moneyCols: [3],
  });

  return wb;
};

/* -------------------- PDF -------------------- */

const drawTable = (doc, { headers, rows, widths, startY }) => {
  const margin = 50;
  let y = startY;
  const headerBg = "#0077b6";
  const zebra = "#f2f7fb";
  const rowHeight = 16;
  const headerHeight = 18;

  const renderHeader = () => {
    let x = margin;
    headers.forEach((h, i) => {
      doc.rect(x, y, widths[i], headerHeight).fill(headerBg);
      x += widths[i];
    });
    x = margin;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#ffffff");
    headers.forEach((h, i) => {
      doc.text(String(h), x + 5, y + 5, { width: widths[i] - 10, height: headerHeight - 8, ellipsis: true });
      x += widths[i];
    });
    y += headerHeight;
  };

  renderHeader();

  rows.forEach((r, idx) => {
    if (y + rowHeight > doc.page.height - 50) {
      doc.addPage();
      y = 50;
      renderHeader();
    }
    const bg = idx % 2 === 0 ? "#ffffff" : zebra;
    let x = margin;
    widths.forEach((w) => {
      doc.rect(x, y, w, rowHeight).fill(bg);
      x += w;
    });
    x = margin;
    doc.font("Helvetica").fontSize(8).fillColor("#222222");
    r.forEach((cell, i) => {
      doc.text(String(cell ?? ""), x + 5, y + 4, { width: widths[i] - 10, height: rowHeight - 5, ellipsis: true });
      x += widths[i];
    });
    y += rowHeight;
  });

  return y + 14;
};

export const streamPdf = (res, data) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);
  const s = data.stats || {};
  const margin = 50;
  const pageWidth = doc.page.width - margin * 2;

  doc.rect(0, 0, doc.page.width, 100).fill("#0b3d5c");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("Analytics Report", margin, 28);
  doc.font("Helvetica").fontSize(10).text(`Period: ${periodLabel(data.period)}`, margin, 62);
  doc.text(`Date range: ${data.from} to ${data.to}  •  Generated: ${new Date(data.generatedAt).toLocaleString()}`, margin, 78);

  const boxes = [
    { label: "Total Revenue", value: money(s.totalEarnings) },
    { label: "Appointments", value: s.totalAppointments },
    { label: "Patients", value: s.totalPatients },
    { label: "Doctors (active)", value: `${s.activeDoctors} / ${s.totalDoctors}` },
    { label: "Completion Rate", value: `${s.completionRate}%` },
    { label: "Cancellation Rate", value: `${s.cancellationRate}%` },
    { label: "Avg / Day", value: `${s.avgDaily} (${money(s.avgDailyRevenue)})` },
    { label: "Peak Hour", value: s.peakHour },
  ];

  const bw = (pageWidth - 3 * 10) / 4;
  const bh = 52;
  boxes.forEach((b, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = margin + col * (bw + 10);
    const y = 118 + row * (bh + 10);
    doc.roundedRect(x, y, bw, bh, 6).fill("#f4f7fb");
    doc.fillColor("#0b3d5c").font("Helvetica-Bold").fontSize(12).text(String(b.value), x + 10, y + 10, { width: bw - 20 });
    doc.font("Helvetica").fontSize(7.5).fillColor("#667788").text(b.label, x + 10, y + 30, { width: bw - 20 });
  });

  let y = 118 + 2 * (bh + 10) + 6;

  const section = (title, body) => {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0b3d5c").text(title, margin, y);
    y += 20;
    y = body();
  };

  const widths = (weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => Math.round((pageWidth * w) / total));
  };

  section("Revenue by Month", () =>
    drawTable(doc, {
      headers: ["Month", "Appointments", "Revenue"],
      widths: widths([5, 4, 4]),
      rows: data.monthly.map((m) => [m.label, m.count, money(m.revenue)]),
      startY: y,
    })
  );

  section("Appointment Trend (Weekly)", () =>
    drawTable(doc, {
      headers: ["Week", "Appointments", "Revenue"],
      widths: widths([6, 3, 4]),
      rows: data.weekly.map((w) => [w.label, w.count, money(w.revenue)]),
      startY: y,
    })
  );

  section("Patient Growth", () =>
    drawTable(doc, {
      headers: ["Month", "New Patients", "Total Patients"],
      widths: widths([4, 4, 4]),
      rows: data.patientGrowth.map((p) => [p.label, p.new, p.total]),
      startY: y,
    })
  );

  section("Doctor Performance", () =>
    drawTable(doc, {
      headers: ["Doctor", "Specialization", "Total", "Completed", "Revenue", "Rate"],
      widths: widths([5, 4, 2, 3, 4, 2]),
      rows: data.doctorPerformance.map((d) => [
        d.name,
        d.specialization,
        d.total,
        d.completed,
        money(d.revenue),
        `${d.completionRate}%`,
      ]),
      startY: y,
    })
  );

  section("Most Booked Doctors", () =>
    drawTable(doc, {
      headers: ["Doctor", "Specialization", "Appointments", "Revenue"],
      widths: widths([5, 4, 3, 4]),
      rows: data.mostBookedDoctors.map((d) => [d.name, d.specialization, d.total, money(d.revenue)]),
      startY: y,
    })
  );

  section("Top Specializations", () =>
    drawTable(doc, {
      headers: ["Specialization", "Appointments", "Revenue", "Doctors"],
      widths: widths([5, 3, 4, 3]),
      rows: data.topSpecializations.map((t) => [t.name, t.count, money(t.revenue), t.doctorCount]),
      startY: y,
    })
  );

  section("Peak Booking Hours", () =>
    drawTable(doc, {
      headers: ["Hour", "Appointments", "Revenue"],
      widths: widths([4, 4, 4]),
      rows: data.peakHours.filter((h) => h.count > 0).map((h) => [h.label, h.count, money(h.revenue)]),
      startY: y,
    })
  );

  doc.end();
};
