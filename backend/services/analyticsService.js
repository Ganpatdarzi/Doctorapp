import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";

const PERIOD_DAYS = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "12m": 365,
  all: 0,
};

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "rejected"];

const WEEKDAYS = [
  { day: "Sunday", short: "Sun" },
  { day: "Monday", short: "Mon" },
  { day: "Tuesday", short: "Tue" },
  { day: "Wednesday", short: "Wed" },
  { day: "Thursday", short: "Thu" },
  { day: "Friday", short: "Fri" },
  { day: "Saturday", short: "Sat" },
];

const pad = (n) => String(n).padStart(2, "0");

const toDateStr = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const hourLabel = (h) => {
  const period = h >= 12 ? "PM" : "AM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${pad(hh)} ${period}`;
};

const parseHour = (slot) => {
  const m = String(slot || "").match(/^(\d{1,2}):\d{2}\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const p = (m[2] || "").toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return h >= 0 && h <= 23 ? h : null;
};

const weekdayIndex = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? -1 : d.getDay();
};

const weekKey = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toDateStr(d);
};

const eachDay = (from, to) => {
  const out = [];
  const end = new Date(`${to}T00:00:00`);
  const d = new Date(`${from}T00:00:00`);
  while (d <= end) {
    const key = toDateStr(d);
    out.push({
      key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const eachWeek = (from, to) => {
  const out = [];
  const d = new Date(`${from}T00:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const end = new Date(`${to}T00:00:00`);
  while (d <= end) {
    const start = new Date(d);
    const endW = new Date(d);
    endW.setDate(d.getDate() + 6);
    out.push({
      key: toDateStr(start),
      label: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endW.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
    d.setDate(d.getDate() + 7);
  }
  return out;
};

const eachMonth = (from, to) => {
  const out = [];
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00`);
  const d = new Date(`${from.slice(0, 7)}-01T00:00:00`);
  while (d <= end) {
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    out.push({
      key,
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
};

export const resolveRange = async (period = "30d") => {
  if (!(period in PERIOD_DAYS)) period = "30d";
  const days = PERIOD_DAYS[period];
  const to = toDateStr(new Date());
  let from;
  if (days > 0) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    from = toDateStr(d);
  } else {
    const earliest = await Appointment.findOne({})
      .sort({ date: 1 })
      .select("date")
      .lean();
    from = earliest?.date || toDateStr(new Date(Date.now() - 365 * 24 * 3600 * 1000));
  }
  return { period, from, to };
};

export const periodLabel = (period = "30d") => {
  const labels = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "3m": "Last 3 months",
    "6m": "Last 6 months",
    "12m": "Last 12 months",
    all: "All time",
  };
  return labels[period] || labels["30d"];
};

const roundPct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);

export const buildAnalytics = async ({ period = "30d" } = {}) => {
  const { from, to } = await resolveRange(period);
  const range = { date: { $gte: from, $lte: to } };

  const [appointments, doctorDocs, patientRows, beforeFrom, totalPatients, totalDoctors] =
    await Promise.all([
      Appointment.find(range)
        .select("date timeSlot status paymentStatus consultationFee meetingType paymentMethod doctorId")
        .lean(),
      Doctor.find()
        .select("name specialization image rating reviews experience isAvailable fees")
        .lean(),
      User.aggregate([
        { $match: { role: "user" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: "user", createdAt: { $lt: new Date(`${from}T00:00:00`) } }),
      User.countDocuments({ role: "user" }),
      Doctor.countDocuments(),
    ]);

  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const revenueByStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const revenueByType = { clinic: 0, video: 0 };
  const revenueByMethod = { online: 0, clinic: 0 };
  const peakHours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: hourLabel(i),
    count: 0,
    revenue: 0,
  }));
  const dayOfWeek = WEEKDAYS.map((w) => ({ day: w.day, short: w.short, count: 0 }));

  const dailyMap = new Map();
  const weeklyMap = new Map();
  const monthlyMap = new Map();
  const perDoctor = new Map();

  let totalEarnings = 0;
  let paidAppointments = 0;
  let onlinePaidCount = 0;
  let videoAppointments = 0;

  for (const a of appointments) {
    const paid = a.paymentStatus === "paid";
    const fee = a.consultationFee || 0;

    if (statusCounts[a.status] !== undefined) statusCounts[a.status] += 1;
    if (a.meetingType === "video") videoAppointments += 1;

    if (paid) {
      totalEarnings += fee;
      paidAppointments += 1;
      if (a.paymentMethod === "online") onlinePaidCount += 1;
      if (revenueByStatus[a.status] !== undefined) revenueByStatus[a.status] += fee;
      if (revenueByType[a.meetingType] !== undefined) revenueByType[a.meetingType] += fee;
      if (revenueByMethod[a.paymentMethod] !== undefined) revenueByMethod[a.paymentMethod] += fee;
    }

    const h = parseHour(a.timeSlot);
    if (h !== null) {
      peakHours[h].count += 1;
      if (paid) peakHours[h].revenue += fee;
    }

    const wd = weekdayIndex(a.date);
    if (wd >= 0) dayOfWeek[wd].count += 1;

    if (!dailyMap.has(a.date)) dailyMap.set(a.date, { count: 0, revenue: 0 });
    const d = dailyMap.get(a.date);
    d.count += 1;
    if (paid) d.revenue += fee;

    const mKey = a.date.slice(0, 7);
    if (!monthlyMap.has(mKey)) monthlyMap.set(mKey, { count: 0, revenue: 0 });
    const mo = monthlyMap.get(mKey);
    mo.count += 1;
    if (paid) mo.revenue += fee;

    const wKey = weekKey(a.date);
    if (!weeklyMap.has(wKey)) weeklyMap.set(wKey, { count: 0, revenue: 0 });
    const wk = weeklyMap.get(wKey);
    wk.count += 1;
    if (paid) wk.revenue += fee;

    const pid = a.doctorId ? a.doctorId.toString() : null;
    if (pid) {
      if (!perDoctor.has(pid)) {
        perDoctor.set(pid, {
          total: 0,
          completed: 0,
          pending: 0,
          confirmed: 0,
          cancelled: 0,
          rejected: 0,
          revenue: 0,
        });
      }
      const p = perDoctor.get(pid);
      p.total += 1;
      if (p[a.status] !== undefined) p[a.status] += 1;
      if (paid) p.revenue += fee;
    }
  }

  const doctorMap = new Map(doctorDocs.map((d) => [d._id.toString(), d]));

  const doctorPerformance = [...perDoctor.entries()]
    .map(([pid, p]) => {
      const doc = doctorMap.get(pid) || {};
      return {
        _id: pid,
        name: doc.name || "Unknown",
        specialization: doc.specialization || "",
        image: doc.image || "",
        rating: doc.rating || 0,
        reviews: doc.reviews || 0,
        experience: doc.experience || 0,
        isAvailable: doc.isAvailable ?? true,
        fees: doc.fees || 0,
        total: p.total,
        completed: p.completed,
        pending: p.pending,
        confirmed: p.confirmed,
        cancelled: p.cancelled,
        rejected: p.rejected,
        revenue: p.revenue,
        completionRate: roundPct(p.completed, p.total),
      };
    })
    .sort((a, b) => b.total - a.total || b.revenue - a.revenue);

  const mostBookedDoctors = doctorPerformance.slice(0, 5).map((d) => ({
    _id: d._id,
    name: d.name,
    specialization: d.specialization,
    image: d.image,
    total: d.total,
    completed: d.completed,
    revenue: d.revenue,
  }));

  const specMap = new Map();
  for (const dp of doctorPerformance) {
    const key = dp.specialization || "General";
    if (!specMap.has(key)) {
      specMap.set(key, { name: key, count: 0, revenue: 0, doctors: new Set() });
    }
    const s = specMap.get(key);
    s.count += dp.total;
    s.revenue += dp.revenue;
    s.doctors.add(dp._id);
  }
  const topSpecializations = [...specMap.values()]
    .map((s) => ({
      name: s.name,
      count: s.count,
      revenue: s.revenue,
      doctorCount: s.doctors.size,
    }))
    .sort((a, b) => b.count - a.count);

  const revenueBySpecialization = topSpecializations
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((s) => ({ name: s.name, revenue: s.revenue, count: s.count }));

  const revenueByDoctor = doctorPerformance
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((d) => ({ _id: d._id, name: d.name, specialization: d.specialization, revenue: d.revenue, total: d.total }));

  const daily = eachDay(from, to)
    .slice(-90)
    .map((d) => {
      const v = dailyMap.get(d.key) || { count: 0, revenue: 0 };
      return { label: d.label, count: v.count, revenue: v.revenue };
    });

  const weekly = eachWeek(from, to)
    .slice(-52)
    .map((w) => {
      const v = weeklyMap.get(w.key) || { count: 0, revenue: 0 };
      return { label: w.label, count: v.count, revenue: v.revenue };
    });

  const months = eachMonth(from, to).slice(-24);
  const monthly = months.map((m) => {
    const v = monthlyMap.get(m.key) || { count: 0, revenue: 0 };
    return { label: m.label, count: v.count, revenue: v.revenue };
  });

  const patientGrowthMap = new Map(patientRows.map((r) => [r._id, r.count]));
  let cumulative = beforeFrom;
  const patientGrowth = months.map((m) => {
    const newPatients = patientGrowthMap.get(m.key) || 0;
    cumulative += newPatients;
    return { label: m.label, new: newPatients, total: cumulative };
  });

  const totalAppointments = appointments.length;
  const peakHour = peakHours.reduce((best, h) => (h.count > best.count ? h : best), peakHours[0]);
  const peakDay = dayOfWeek.reduce((best, d) => (d.count > best.count ? d : best), dayOfWeek[0]);

  const daysInRange = Math.min(daily.length, 90);
  const avgDaily = daysInRange > 0 ? Math.round(totalAppointments / daysInRange) : 0;
  const avgDailyRevenue = daysInRange > 0 ? Math.round(totalEarnings / daysInRange) : 0;

  const stats = {
    totalAppointments,
    totalEarnings,
    totalPatients,
    totalDoctors,
    activeDoctors: doctorDocs.filter((d) => d.isAvailable).length,
    paidAppointments,
    completionRate: roundPct(statusCounts.completed, totalAppointments),
    cancellationRate: roundPct(statusCounts.cancelled, totalAppointments),
    videoShare: roundPct(videoAppointments, totalAppointments),
    onlinePaymentShare: roundPct(onlinePaidCount, paidAppointments),
    avgDaily,
    avgDailyRevenue,
    peakHour: peakHour?.label || "-",
    peakHourCount: peakHour?.count || 0,
    peakDay: peakDay?.day || "-",
    peakDayCount: peakDay?.count || 0,
  };

  return {
    period,
    from,
    to,
    stats,
    statusDistribution: STATUSES.filter((s) => statusCounts[s] > 0).map((s) => ({
      status: s,
      count: statusCounts[s],
    })),
    daily,
    weekly,
    monthly,
    revenueByStatus: STATUSES.filter((s) => revenueByStatus[s] > 0).map((s) => ({
      status: s,
      revenue: revenueByStatus[s],
    })),
    revenueByType: [
      { name: "Clinic", value: revenueByType.clinic },
      { name: "Video", value: revenueByType.video },
    ].filter((x) => x.value > 0),
    revenueByMethod: [
      { name: "Online", value: revenueByMethod.online },
      { name: "At Clinic", value: revenueByMethod.clinic },
    ].filter((x) => x.value > 0),
    revenueBySpecialization,
    revenueByDoctor,
    patientGrowth,
    doctorPerformance,
    mostBookedDoctors,
    topSpecializations,
    peakHours,
    dayOfWeek,
    generatedAt: new Date().toISOString(),
  };
};
