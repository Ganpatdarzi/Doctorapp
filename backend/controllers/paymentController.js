import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { sendPaymentReceiptEmail, sendRefundEmail } from "../services/emailService.js";
import {
  getStripe,
  getStripeCurrency,
  toStripeAmount,
  generateReceiptNumber,
  getFrontendUrl,
  refundPaymentRecord,
} from "../services/paymentService.js";

const createCheckoutSession = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return sendError(res, 400, "Appointment ID is required");
    }

    const appointment = await Appointment.findById(appointmentId).populate(
      "doctorId",
      "name fees"
    );

    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to pay for this appointment");
    }

    if (appointment.paymentMethod !== "online") {
      return sendError(res, 400, "This appointment is set to pay at clinic");
    }

    if (appointment.paymentStatus === "paid") {
      return sendError(res, 400, "This appointment is already paid");
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      return sendError(res, 400, "Cannot pay for this appointment in its current state");
    }

    if (!appointment.consultationFee || appointment.consultationFee <= 0) {
      return sendError(res, 400, "This appointment has no consultation fee");
    }

    let payment = await Payment.findOne({
      appointmentId: appointment._id,
      status: "pending",
    });

    if (!payment) {
      payment = await Payment.create({
        receiptNumber: generateReceiptNumber(),
        userId: appointment.userId,
        doctorId: appointment.doctorId._id,
        appointmentId: appointment._id,
        amount: appointment.consultationFee,
        currency: "PKR",
        paymentMethod: "online",
        provider: "stripe",
        status: "pending",
      });
    }

    if (!appointment.paymentId || appointment.paymentId.toString() !== payment._id.toString()) {
      appointment.paymentId = payment._id;
      await appointment.save();
    }

    const stripe = getStripe();

    if (!stripe) {
      payment.provider = "demo";
      payment.status = "paid";
      payment.paidAt = new Date();
      await payment.save();

      appointment.paymentStatus = "paid";
      if (appointment.status === "pending") appointment.status = "confirmed";
      await appointment.save();

      sendPaymentReceiptEmail(payment, req.user.email);

      return sendSuccess(res, 200, "Payment completed (demo mode)", {
        demo: true,
        url: null,
        payment,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: getStripeCurrency(),
            unit_amount: toStripeAmount(appointment.consultationFee),
            product_data: {
              name: `Consultation with Dr. ${appointment.doctorId.name}`,
              description: `Appointment on ${appointment.date} at ${appointment.timeSlot}`,
            },
          },
        },
      ],
      metadata: {
        appointmentId: appointment._id.toString(),
        paymentId: payment._id.toString(),
      },
      payment_intent_data: {
        metadata: {
          appointmentId: appointment._id.toString(),
          paymentId: payment._id.toString(),
        },
      },
      success_url: `${getFrontendUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}&appointment=${appointment._id}`,
      cancel_url: `${getFrontendUrl()}/payment/failure?appointment=${appointment._id}`,
    });

    payment.checkoutSessionId = session.id;
    payment.provider = "stripe";
    await payment.save();

    return sendSuccess(res, 200, "Checkout session created", {
      url: session.url,
      demo: false,
    });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res) => {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return res.status(400).json({ error: "Stripe webhook is not configured" });
  }

  let event;
  try {
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const payment = await Payment.findOne({ checkoutSessionId: session.id });

      if (payment) {
        let paymentIntent = null;
        if (session.payment_intent) {
          paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        }

        payment.providerPaymentId =
          session.payment_intent || payment.providerPaymentId;
        payment.receiptUrl = paymentIntent?.latest_charge?.receipt_url || "";
        payment.status = "paid";
        payment.paidAt = new Date();
        await payment.save();

        const appointment = await Appointment.findById(payment.appointmentId);
        if (appointment) {
          appointment.paymentStatus = "paid";
          if (appointment.status === "pending") appointment.status = "confirmed";
          await appointment.save();
        }

        const user = await User.findById(payment.userId);
        sendPaymentReceiptEmail(payment, user?.email);
      }
    } catch (err) {
      return res.status(500).send(`Webhook handler failed: ${err.message}`);
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    try {
      const payment = await Payment.findOneAndUpdate(
        { checkoutSessionId: session.id, status: "pending" },
        { status: "failed" },
        { new: true }
      );

      if (payment) {
        await Appointment.updateOne(
          { _id: payment.appointmentId, paymentStatus: { $ne: "paid" } },
          { paymentStatus: "failed" }
        );
      }
    } catch (err) {
      return res.status(500).send(`Webhook handler failed: ${err.message}`);
    }
  }

  res.json({ received: true });
};

const getPaymentForAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    const userId = req.user._id.toString();
    const appointmentPatientId = appointment.userId?.toString();
    const doctorId = appointment.doctorId?.toString();
    const isAdmin = req.userRole === "admin";

    if (userId !== appointmentPatientId && userId !== doctorId && !isAdmin) {
      return sendError(res, 403, "Not authorized to view this payment");
    }

    const payment = await Payment.findOne({ appointmentId: appointment._id }).sort({
      createdAt: -1,
    });

    if (!payment) {
      return sendError(res, 404, "No payment found for this appointment");
    }

    const populated = await Payment.populate(payment, [
      { path: "doctorId", select: "name specialization image" },
      { path: "userId", select: "name email phone" },
      { path: "appointmentId", select: "date timeSlot status paymentStatus" },
    ]);

    return sendSuccess(res, 200, "Payment retrieved", populated);
  } catch (error) {
    next(error);
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { userId: req.user._id };
    if (status && status !== "all") query.status = status;

    const total = await Payment.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const payments = await Payment.find(query)
      .populate("doctorId", "name specialization image")
      .populate("appointmentId", "date timeSlot status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return sendSuccess(res, 200, "Payments retrieved", {
      payments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("doctorId", "name specialization image hospital location")
      .populate("userId", "name email phone address")
      .populate(
        "appointmentId",
        "date timeSlot status paymentStatus consultationFee patientNotes"
      );

    if (!payment) {
      return sendError(res, 404, "Payment not found");
    }

    const userId = req.user._id.toString();
    const paymentPatientId = payment.userId?._id?.toString() || payment.userId?.toString();
    const doctorId = payment.doctorId?._id?.toString() || payment.doctorId?.toString();
    const isAdmin = req.userRole === "admin";

    if (userId !== paymentPatientId && userId !== doctorId && !isAdmin) {
      return sendError(res, 403, "Not authorized to view this payment");
    }

    return sendSuccess(res, 200, "Payment retrieved", payment);
  } catch (error) {
    next(error);
  }
};

const refundPayment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendError(res, 404, "Payment not found");
    }

    if (payment.status !== "paid") {
      return sendError(res, 400, "Only paid payments can be refunded");
    }

    try {
      await refundPaymentRecord(payment, reason || "Refunded by admin");
    } catch (err) {
      return sendError(res, 502, `Refund failed: ${err.message}`);
    }

    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment && ["pending", "confirmed"].includes(appointment.status)) {
      appointment.status = "cancelled";
      appointment.cancellationReason =
        appointment.cancellationReason || "Payment refunded";
      await appointment.save();
    }

    const updated = await Payment.findById(payment._id)
      .populate("doctorId", "name specialization image")
      .populate("userId", "name email phone");

    sendRefundEmail(updated, updated.userId?.email);

    return sendSuccess(res, 200, "Payment refunded successfully", updated);
  } catch (error) {
    next(error);
  }
};

const adminGetPayments = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let query = {};
    if (status && status !== "all") query.status = status;

    if (search) {
      const regex = { $regex: search, $options: "i" };
      const [patients, doctors, receiptPayments] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select("_id"),
        Doctor.find({ $or: [{ name: regex }, { specialization: regex }] }).select("_id"),
        Payment.find({ receiptNumber: regex }).select("_id"),
      ]);

      const matchingIds = [...patients, ...doctors].map((d) => d._id);
      const receiptIds = receiptPayments.map((p) => p._id);

      if (matchingIds.length === 0 && receiptIds.length === 0) {
        return sendSuccess(res, 200, "Payments retrieved", {
          payments: [],
          pagination: { total: 0, page: Number(page), pages: 0 },
        });
      }

      query.$or = [
        { userId: { $in: matchingIds } },
        { doctorId: { $in: matchingIds } },
        { _id: { $in: receiptIds } },
      ];
    }

    const total = await Payment.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const payments = await Payment.find(query)
      .populate("userId", "name email phone image")
      .populate("doctorId", "name specialization image")
      .populate("appointmentId", "date timeSlot status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return sendSuccess(res, 200, "Payments retrieved", {
      payments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminGetPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("doctorId", "name specialization image hospital location fees")
      .populate("userId", "name email phone address image")
      .populate(
        "appointmentId",
        "date timeSlot status paymentStatus consultationFee patientNotes cancellationReason"
      );

    if (!payment) {
      return sendError(res, 404, "Payment not found");
    }

    return sendSuccess(res, 200, "Payment retrieved", payment);
  } catch (error) {
    next(error);
  }
};

const adminUpdatePayment = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendError(res, 404, "Payment not found");
    }

    if (payment.status === "refunded") {
      return sendError(res, 400, "Cannot change the amount of a refunded payment");
    }

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return sendError(res, 400, "A valid amount greater than 0 is required");
    }

    const newAmount = Number(amount);
    const previousAmount = payment.amount;

    if (newAmount !== previousAmount) {
      payment.amount = newAmount;
      payment.amountEdited = {
        previousAmount,
        editedAt: new Date(),
        editedBy: req.user._id,
        reason: (reason || "").trim(),
      };
      await payment.save();

      if (payment.appointmentId) {
        await Appointment.findByIdAndUpdate(payment.appointmentId, {
          consultationFee: newAmount,
        });
      }
    }

    const populated = await Payment.findById(payment._id)
      .populate("doctorId", "name specialization image hospital location fees")
      .populate("userId", "name email phone address image")
      .populate(
        "appointmentId",
        "date timeSlot status paymentStatus consultationFee patientNotes cancellationReason"
      );

    return sendSuccess(res, 200, "Payment amount updated", populated);
  } catch (error) {
    next(error);
  }
};

const getPaymentReportData = async ({ doctorId, from, to, status }) => {
  const filter = {};
  if (doctorId) filter.doctorId = doctorId;
  if (status && status !== "all") filter.status = status;

  if (from || to) {
    const range = {};
    if (from) range.$gte = new Date(`${from}T00:00:00`);
    if (to) {
      const end = new Date(`${to}T23:59:59.999`);
      range.$lte = end;
    }
    filter.$or = [
      { paidAt: { $ne: null, ...range } },
      { paidAt: null, createdAt: range },
    ];
  }

  const payments = await Payment.find(filter)
    .populate("userId", "name email phone")
    .populate("doctorId", "name specialization")
    .populate("appointmentId", "date timeSlot status")
    .sort({ paidAt: -1, createdAt: -1 });

  const paid = payments.filter((p) => p.status === "paid");

  const summary = {
    totalRecords: payments.length,
    paidCount: paid.length,
    refundedCount: payments.filter((p) => p.status === "refunded").length,
    failedCount: payments.filter((p) => p.status === "failed").length,
    pendingCount: payments.filter((p) => p.status === "pending").length,
    totalAmount: paid.reduce((s, p) => s + (p.amount || 0), 0),
    refundedAmount: payments
      .filter((p) => p.status === "refunded")
      .reduce((s, p) => s + (p.amount || 0), 0),
    onlineAmount: paid
      .filter((p) => p.paymentMethod === "online")
      .reduce((s, p) => s + (p.amount || 0), 0),
    clinicAmount: paid
      .filter((p) => p.paymentMethod === "clinic")
      .reduce((s, p) => s + (p.amount || 0), 0),
  };

  const monthly = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.push({
      key,
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      total: 0,
      count: 0,
    });
  }
  const monthlyIndex = new Map(monthly.map((m) => [m.key, m]));
  paid.forEach((p) => {
    const paidDate = p.paidAt || p.createdAt;
    const key = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyIndex.get(key);
    if (bucket) {
      bucket.total += p.amount || 0;
      bucket.count += 1;
    }
  });

  return { payments, summary, monthly };
};

const buildPaymentCsv = (payments) => {
  const header = [
    "Receipt Number",
    "Date",
    "Patient",
    "Doctor",
    "Amount",
    "Currency",
    "Method",
    "Provider",
    "Status",
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = payments.map((p) => {
    const date = (p.paidAt || p.createdAt || new Date()).toISOString().split("T")[0];
    return [
      p.receiptNumber,
      date,
      esc(p.userId?.name),
      esc(p.doctorId?.name),
      p.amount,
      p.currency,
      p.paymentMethod,
      p.provider,
      p.status,
    ].join(",");
  });
  return [header.join(","), ...rows].join("\n");
};

const sendCsv = (res, csv) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=payments-report-${Date.now()}.csv`
  );
  res.send(csv);
};

const getAdminPaymentReport = async (req, res, next) => {
  try {
    const { from, to, status, format } = req.query;
    const data = await getPaymentReportData({ from, to, status });
    if (format === "csv") return sendCsv(res, buildPaymentCsv(data.payments));
    return sendSuccess(res, 200, "Payment report retrieved", data);
  } catch (error) {
    next(error);
  }
};

const getDoctorPaymentReport = async (req, res, next) => {
  try {
    const { from, to, status, format } = req.query;
    const data = await getPaymentReportData({
      doctorId: req.user._id,
      from,
      to,
      status,
    });
    if (format === "csv") return sendCsv(res, buildPaymentCsv(data.payments));
    return sendSuccess(res, 200, "Payment report retrieved", data);
  } catch (error) {
    next(error);
  }
};

export {
  createCheckoutSession,
  handleWebhook,
  getPaymentForAppointment,
  getMyPayments,
  getPaymentById,
  refundPayment,
  adminUpdatePayment,
  adminGetPayments,
  adminGetPaymentById,
  getAdminPaymentReport,
  getDoctorPaymentReport,
};
