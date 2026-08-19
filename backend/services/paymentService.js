import Stripe from "stripe";
import Appointment from "../models/Appointment.js";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw",
  "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

export const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
};

export const isPaymentLive = () => Boolean(process.env.STRIPE_SECRET_KEY);

export const getStripeCurrency = () =>
  (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

export const toStripeAmount = (amountPkr) => {
  const base = Math.round(Number(amountPkr) || 0);
  const currency = getStripeCurrency();
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) return base;
  return base * 100;
};

export const generateReceiptNumber = () => {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAY-${ymd}-${rand}`;
};

export const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

export const refundPaymentRecord = async (payment, reason) => {
  const stripe = getStripe();
  let refundId = "";
  let refundStatus = "succeeded";

  if (stripe && payment.providerPaymentId) {
    const refund = await stripe.refunds.create({
      payment_intent: payment.providerPaymentId,
    });
    refundId = refund.id;
    refundStatus = refund.status || "succeeded";
  }

  payment.status = "refunded";
  payment.refund = {
    refundId,
    amount: payment.amount,
    reason: reason || "Refund",
    status: refundStatus,
    refundedAt: new Date(),
  };
  await payment.save();

  const appointment = await Appointment.findById(payment.appointmentId);
  if (appointment) {
    appointment.paymentStatus = "refunded";
    await appointment.save();
  }

  return payment;
};
