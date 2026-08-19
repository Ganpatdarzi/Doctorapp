import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { refundPaymentRecord } from "../services/paymentService.js";
import {
  sendAppointmentBookedEmail,
  sendAppointmentCancelledEmail,
  sendAppointmentRescheduledEmail,
} from "../services/emailService.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { generateMeetingRoom } from "../utils/meetingUtil.js";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const parseDateInfo = (date) => {
  if (typeof date !== "string") return null;
  const parts = date.split("-").map(Number);
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return null;
  const [year, month, day] = parts;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  if (!isRealDate) return null;
  return {
    dayName: DAY_NAMES[parsed.getUTCDay()],
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
};

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, patientNotes, paymentMethod, meetingType } = req.body;

    const errors = [];
    if (!doctorId) errors.push("Doctor ID is required");
    if (!date) errors.push("Appointment date is required");
    if (!timeSlot) errors.push("Time slot is required");
    if (paymentMethod && !["online", "clinic"].includes(paymentMethod)) {
      errors.push("Payment method must be 'online' or 'clinic'");
    }
    if (meetingType && !["clinic", "video"].includes(meetingType)) {
      errors.push("Consultation type must be 'clinic' or 'video'");
    }

    if (errors.length > 0) {
      return sendError(res, 400, "Validation failed", errors);
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    if (!doctor.isAvailable) {
      return sendError(res, 400, "This doctor is currently not available");
    }

    const dateInfo = parseDateInfo(date);
    if (!dateInfo) {
      return sendError(res, 400, "Invalid appointment date");
    }
    if (dateInfo.dateKey < getTodayKey()) {
      return sendError(res, 400, "Cannot book appointments for past dates");
    }

    const dayName = dateInfo.dayName;
    if (!doctor.availableDays.includes(dayName)) {
      return sendError(res, 400, `Doctor is not available on ${dayName}`);
    }

    if (!doctor.availableSlots.includes(timeSlot)) {
      return sendError(res, 400, `Time slot ${timeSlot} is not available for this doctor`);
    }

    const existingSlot = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingSlot) {
      return sendError(res, 409, "This time slot is already booked. Please select another.");
    }

    const userBooking = await Appointment.findOne({
      userId: req.user._id,
      doctorId,
      date,
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });

    if (userBooking) {
      return sendError(res, 409, "You already have an appointment with this doctor at this time");
    }

    const appointment = await Appointment.create({
      userId: req.user._id,
      doctorId,
      date,
      timeSlot,
      consultationFee: doctor.fees,
      patientNotes: patientNotes || "",
      paymentMethod: paymentMethod || "clinic",
      paymentStatus: "pending",
      meetingType: meetingType || "clinic",
      meetingProvider: meetingType === "video" ? "jitsi" : undefined,
      meetingRoom: meetingType === "video" ? generateMeetingRoom() : "",
    });

    const populated = await appointment.populate([
      { path: "doctorId", select: "name specialization image email" },
      { path: "userId", select: "name email phone" },
    ]);

    sendAppointmentBookedEmail(populated, populated.userId?.email);

    return sendSuccess(res, 201, "Appointment booked successfully", populated);
  } catch (error) {
    next(error);
  }
};

const getMyAppointments = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let query = { userId: req.user._id };

    if (status && status !== "all") {
      query.status = status;
    }

    let appointments = Appointment.find(query)
      .populate("doctorId", "name specialization image email location hospital fees")
      .sort({ createdAt: -1 });

    if (search) {
      appointments = appointments.populate("doctorId");
    }

    const total = await Appointment.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);
    const results = await appointments.skip(skip).limit(Number(limit));

    if (search) {
      const filtered = results.filter(
        (a) =>
          a.doctorId?.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.doctorId?.specialization?.toLowerCase().includes(search.toLowerCase())
      );
      return sendSuccess(res, 200, "Appointments retrieved", {
        appointments: filtered,
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      });
    }

    return sendSuccess(res, 200, "Appointments retrieved", {
      appointments: results,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctorId", "name specialization image email location hospital fees phone about education experience")
      .populate("userId", "name email phone dob gender address");

    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    const userId = req.user._id.toString();
    const appointmentPatientId = appointment.userId?._id?.toString() || appointment.userId?.toString();
    const doctorId = appointment.doctorId?._id?.toString();
    const isAdmin = req.userRole === "admin";

    if (userId !== appointmentPatientId && userId !== doctorId && !isAdmin) {
      return sendError(res, 403, "Not authorized to view this appointment");
    }

    return sendSuccess(res, 200, "Appointment retrieved", appointment);
  } catch (error) {
    next(error);
  }
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return sendError(res, 400, "New date and time slot are required");
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to reschedule this appointment");
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      return sendError(res, 400, "Only pending or confirmed appointments can be rescheduled");
    }

    const dateInfo = parseDateInfo(date);
    if (!dateInfo) {
      return sendError(res, 400, "Invalid appointment date");
    }
    if (dateInfo.dateKey < getTodayKey()) {
      return sendError(res, 400, "Cannot reschedule to a past date");
    }

    const doctor = await Doctor.findById(appointment.doctorId);
    const dayName = dateInfo.dayName;

    if (!doctor.availableDays.includes(dayName)) {
      return sendError(res, 400, `Doctor is not available on ${dayName}`);
    }

    if (!doctor.availableSlots.includes(timeSlot)) {
      return sendError(res, 400, `Time slot ${timeSlot} is not available`);
    }

    const conflict = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date,
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
      _id: { $ne: appointment._id },
    });

    if (conflict) {
      return sendError(res, 409, "This time slot is already booked");
    }

    appointment.date = date;
    appointment.timeSlot = timeSlot;
    await appointment.save();

    const updated = await appointment.populate([
      { path: "doctorId", select: "name specialization image email" },
      { path: "userId", select: "name email phone" },
    ]);

    sendAppointmentRescheduledEmail(updated, updated.userId?.email);

    return sendSuccess(res, 200, "Appointment rescheduled successfully", updated);
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to cancel this appointment");
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      return sendError(res, 400, "Only pending or confirmed appointments can be cancelled");
    }

    appointment.status = "cancelled";
    appointment.cancellationReason = cancellationReason || "";
    await appointment.save();

    const populatedForEmail = await appointment.populate({
      path: "userId",
      select: "name email",
    });
    sendAppointmentCancelledEmail(appointment, populatedForEmail.userId?.email);

    if (
      appointment.paymentStatus === "paid" &&
      appointment.paymentMethod === "online"
    ) {
      const payment = await Payment.findOne({
        appointmentId: appointment._id,
        status: "paid",
      });

      if (payment) {
        try {
          await refundPaymentRecord(
            payment,
            cancellationReason || "Appointment cancelled by patient"
          );
        } catch (err) {
          // Refund failure should not block cancellation; payment stays paid for manual handling.
          console.error("Auto-refund failed:", err.message);
        }
      }
    }

    return sendSuccess(res, 200, "Appointment cancelled successfully");
  } catch (error) {
    next(error);
  }
};

export {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
};
