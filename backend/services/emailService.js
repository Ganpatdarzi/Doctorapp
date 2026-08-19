import nodemailer from "nodemailer";
import { getFrontendUrl } from "./paymentService.js";

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendMail = async (to, subject, html) => {
  if (!to) return;
  const transport = getTransporter();
  if (!transport) {
    console.log(`\n[EMAIL:DEV] To: ${to}`);
    console.log(`[EMAIL:DEV] Subject: ${subject}`);
    console.log(`[EMAIL:DEV] Body: ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`);
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || `DocBook <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

const layout = (title, bodyHtml) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#2563eb;color:#fff;padding:16px 24px">
      <strong style="font-size:18px">DocBook</strong>
      <span style="float:right;font-size:13px;opacity:.9">Doctor Appointment System</span>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:24px;font-size:12px;color:#64748b">
        This is an automated message from DocBook. Please do not reply to this email.
      </p>
    </div>
  </div>
`;

const appointmentBlock = (appointment) => {
  const doctor = appointment.doctorId || {};
  const dateStr = appointment.date || "N/A";
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#64748b">Doctor</td><td style="padding:8px 0;font-weight:600">${doctor.name || "N/A"}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Specialization</td><td style="padding:8px 0">${doctor.specialization || ""}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Date</td><td style="padding:8px 0">${dateStr}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Time</td><td style="padding:8px 0">${appointment.timeSlot || "N/A"}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Fee</td><td style="padding:8px 0">Rs. ${appointment.consultationFee || 0}</td></tr>
    </table>
  `;
};

const actionButton = (label, url) => `
  <p style="margin:20px 0 0">
    <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600">${label}</a>
  </p>
`;

export const sendAppointmentBookedEmail = async (appointment, userEmail) => {
  const base = getFrontendUrl();
  await sendMail(
    userEmail,
    "Appointment Booked Successfully",
    layout(
      "Appointment Booked",
      `<p>Your appointment has been booked successfully.</p>${appointmentBlock(appointment)}${actionButton("View My Appointments", `${base}/my-appointments`)}`
    )
  );
};

export const sendPaymentReceiptEmail = async (payment, userEmail) => {
  const base = getFrontendUrl();
  await sendMail(
    userEmail,
    `Payment Receipt ${payment.receiptNumber}`,
    layout(
      "Payment Receipt",
      `<p>Your payment of <strong>Rs. ${payment.amount}</strong> was successful.</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">
         <tr><td style="padding:8px 0;color:#64748b">Receipt No</td><td style="padding:8px 0;font-weight:600">${payment.receiptNumber}</td></tr>
         <tr><td style="padding:8px 0;color:#64748b">Status</td><td style="padding:8px 0">${payment.status}</td></tr>
       </table>
       ${actionButton("View Receipt", `${base}/receipt/${payment._id}`)}`
    )
  );
};

export const sendAppointmentRescheduledEmail = async (appointment, userEmail) => {
  await sendMail(
    userEmail,
    "Appointment Rescheduled",
    layout(
      "Appointment Rescheduled",
      `<p>Your appointment has been rescheduled to the following time.</p>${appointmentBlock(appointment)}${actionButton("View My Appointments", `${getFrontendUrl()}/my-appointments`)}`
    )
  );
};

export const sendRefundEmail = async (payment, userEmail) => {
  const base = getFrontendUrl();
  await sendMail(
    userEmail,
    `Refund Processed ${payment.receiptNumber}`,
    layout(
      "Payment Refunded",
      `<p>Your payment of <strong>Rs. ${payment.amount}</strong> has been refunded.</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">
         <tr><td style="padding:8px 0;color:#64748b">Receipt No</td><td style="padding:8px 0;font-weight:600">${payment.receiptNumber}</td></tr>
         <tr><td style="padding:8px 0;color:#64748b">Refund Status</td><td style="padding:8px 0">${payment.refund?.status || "succeeded"}</td></tr>
         <tr><td style="padding:8px 0;color:#64748b">Reason</td><td style="padding:8px 0">${payment.refund?.reason || "Refund"}</td></tr>
       </table>
       <p style="font-size:13px;color:#64748b">If you paid by card, the amount may take 5–10 business days to reflect in your account.</p>
       ${actionButton("View Payments", `${base}/my-payments`)}`
    )
  );
};

export const sendAppointmentCancelledEmail = async (appointment, userEmail) => {
  await sendMail(
    userEmail,
    "Appointment Cancelled",
    layout(
      "Appointment Cancelled",
      `<p>Your appointment has been cancelled.</p>${appointmentBlock(appointment)}${
        appointment.cancellationReason
          ? `<p style="color:#721c24;background:#f8d7da;padding:10px 14px;border-radius:8px;font-size:13px">Reason: ${appointment.cancellationReason}</p>`
          : ""
      }`
    )
  );
};

export const sendAppointmentStatusEmail = async (appointment, userEmail) => {
  await sendMail(
    userEmail,
    `Appointment ${appointment.status}`,
    layout(
      `Appointment ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}`,
      `<p>Your appointment status has been updated to <strong>${appointment.status}</strong>.</p>${appointmentBlock(appointment)}`
    )
  );
};
