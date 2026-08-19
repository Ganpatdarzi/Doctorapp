import bcrypt from "bcryptjs";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import generateToken from "../utils/generateToken.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { sendAppointmentStatusEmail } from "../services/emailService.js";
import { generateReceiptNumber } from "../services/paymentService.js";
import { generateMeetingRoom } from "../utils/meetingUtil.js";
import { optimizeUploadedImage } from "../utils/imageProcessor.js";

const toMinutes = (time) => {
  if (!time) return 0;
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3];
  if (period) {
    const isPM = period.toUpperCase() === "PM";
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  }
  return hours * 60 + mins;
};

const to12Hour = (minutes) => {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

const generateSlots = (start, end, duration, breaks) => {
  const slots = [];
  const startM = toMinutes(start);
  const endM = toMinutes(end);
  for (let t = startM; t + duration <= endM; t += duration) {
    const slotStart = t;
    const slotEnd = t + duration;
    const inBreak = (breaks || []).some(
      (b) => b.start && b.end && slotStart < toMinutes(b.end) && slotEnd > toMinutes(b.start)
    );
    if (!inBreak) {
      slots.push(to12Hour(slotStart));
    }
  }
  return slots;
};

const todayString = () => new Date().toLocaleDateString("en-CA");

const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const errors = [];
    if (!email || !email.trim()) errors.push("Email is required");
    if (!password) errors.push("Password is required");

    if (errors.length > 0) {
      return sendError(res, 400, "Validation failed", errors);
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase() });
    if (!doctor) {
      return sendError(res, 401, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password");
    }

    const token = generateToken(doctor._id, "doctor");

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, 200, "Login successful", {
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      role: "doctor",
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user._id).select("-password");

    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    return sendSuccess(res, 200, "Profile retrieved successfully", doctor);
  } catch (error) {
    next(error);
  }
};

const updateDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    const updatableFields = [
      "name", "phone", "gender", "dob", "specialization", "education",
      "experience", "fees", "location", "hospital", "address", "about",
      "languages", "availableDays", "availableSlots", "isOnline",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    if (req.file) {
      doctor.image = `/uploads/${await optimizeUploadedImage(req.file.path)}`;
    }

    const updatedDoctor = await doctor.save();

    return sendSuccess(res, 200, "Profile updated successfully", {
      _id: updatedDoctor._id,
      name: updatedDoctor.name,
      email: updatedDoctor.email,
      image: updatedDoctor.image,
      phone: updatedDoctor.phone,
      gender: updatedDoctor.gender,
      dob: updatedDoctor.dob,
      specialization: updatedDoctor.specialization,
      education: updatedDoctor.education,
      experience: updatedDoctor.experience,
      fees: updatedDoctor.fees,
      location: updatedDoctor.location,
      hospital: updatedDoctor.hospital,
      address: updatedDoctor.address,
      about: updatedDoctor.about,
      languages: updatedDoctor.languages,
      availableDays: updatedDoctor.availableDays,
      availableSlots: updatedDoctor.availableSlots,
      isOnline: updatedDoctor.isOnline,
    });
  } catch (error) {
    next(error);
  }
};

const changeDoctorPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const errors = [];
    if (!currentPassword) errors.push("Current password is required");
    if (!newPassword) errors.push("New password is required");
    else if (newPassword.length < 6) {
      errors.push("New password must be at least 6 characters");
    }

    if (errors.length > 0) {
      return sendError(res, 400, "Validation failed", errors);
    }

    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, doctor.password);
    if (!isMatch) {
      return sendError(res, 401, "Current password is incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    doctor.password = await bcrypt.hash(newPassword, salt);
    await doctor.save();

    return sendSuccess(res, 200, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

const getDoctorAppointments = async (req, res, next) => {
  try {
    const { status, search, date, sort, meetingType, page = 1, limit = 20 } = req.query;

    let query = { doctorId: req.user._id };

    if (status && status !== "all") {
      query.status = status;
    }

    if (meetingType && meetingType !== "all") {
      query.meetingType = meetingType;
    }

    if (date) {
      query.date = date;
    }

    if (search) {
      const patients = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const patientIds = patients.map((p) => p._id);
      if (patientIds.length === 0) {
        return sendSuccess(res, 200, "Appointments retrieved", {
          appointments: [],
          pagination: { total: 0, page: Number(page), pages: 0 },
        });
      }
      query.userId = { $in: patientIds };
    }

    const total = await Appointment.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    let sortOption = { createdAt: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const appointments = Appointment.find(query)
      .populate("userId", "name email phone dob gender address image")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    let results = await appointments;

    if (sort === "time" || sort === "time-desc") {
      const direction = sort === "time-desc" ? -1 : 1;
      results = results.sort(
        (a, b) => (toMinutes(a.timeSlot) - toMinutes(b.timeSlot)) * direction
      );
    }

    return sendSuccess(res, 200, "Appointments retrieved", {
      appointments: results,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { action, doctorNotes } = req.body;
    const validActions = ["accept", "reject", "complete", "cancel"];

    if (!action || !validActions.includes(action)) {
      return sendError(res, 400, `Invalid action. Must be one of: ${validActions.join(", ")}`);
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to manage this appointment");
    }

    const statusMap = {
      accept: "confirmed",
      reject: "rejected",
      complete: "completed",
      cancel: "cancelled",
    };

    const validTransitions = {
      pending: ["accept", "reject", "cancel"],
      confirmed: ["complete", "cancel"],
    };

    const allowed = validTransitions[appointment.status];
    if (!allowed || !allowed.includes(action)) {
      return sendError(res, 400, `Cannot ${action} an appointment with status: ${appointment.status}`);
    }

    appointment.status = statusMap[action];
    if (doctorNotes) {
      appointment.doctorNotes = doctorNotes;
    }

    if (
      action === "accept" &&
      appointment.meetingType === "video" &&
      !appointment.meetingRoom
    ) {
      appointment.meetingProvider = "jitsi";
      appointment.meetingRoom = generateMeetingRoom();
    }

    if (action === "complete") {
      appointment.paymentStatus = "paid";
    }

    await appointment.save();

    const updated = await appointment.populate([
      { path: "userId", select: "name email phone" },
      { path: "doctorId", select: "name specialization image" },
    ]);

    sendAppointmentStatusEmail(updated, updated.userId?.email);

    return sendSuccess(res, 200, `Appointment ${statusMap[action]} successfully`, updated);
  } catch (error) {
    next(error);
  }
};

const getDoctorAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("userId", "name email phone dob gender address image")
      .populate("doctorId", "name specialization image email phone");

    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    const ownerId = appointment.doctorId?._id?.toString() || appointment.doctorId?.toString();
    if (ownerId !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to view this appointment");
    }

    return sendSuccess(res, 200, "Appointment retrieved", appointment);
  } catch (error) {
    next(error);
  }
};

const updateAppointmentNotes = async (req, res, next) => {
  try {
    const { doctorNotes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to update this appointment");
    }

    appointment.doctorNotes = doctorNotes || "";
    await appointment.save();

    return sendSuccess(res, 200, "Consultation notes updated successfully", {
      _id: appointment._id,
      doctorNotes: appointment.doctorNotes,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { doctorId: req.user._id };
    if (status && status !== "all") query.status = status;

    const total = await Payment.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const payments = await Payment.find(query)
      .populate("userId", "name email phone image")
      .populate("appointmentId", "date timeSlot status paymentStatus")
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

const markClinicPayment = async (req, res, next) => {
  try {
    const { action } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to manage this appointment");
    }

    if (appointment.paymentMethod !== "clinic") {
      return sendError(res, 400, "This appointment is set to pay online");
    }

    if (action === "paid") {
      if (appointment.paymentStatus === "paid") {
        return sendError(res, 400, "Payment is already marked as paid");
      }

      let payment = await Payment.findOne({
        appointmentId: appointment._id,
        status: "paid",
      });

      if (!payment) {
        payment = await Payment.create({
          receiptNumber: generateReceiptNumber(),
          userId: appointment.userId,
          doctorId: appointment.doctorId,
          appointmentId: appointment._id,
          amount: appointment.consultationFee || 0,
          currency: "PKR",
          paymentMethod: "clinic",
          provider: "clinic",
          status: "paid",
          paidAt: new Date(),
        });
      }

      appointment.paymentId = payment._id;
      appointment.paymentStatus = "paid";
      await appointment.save();
    } else if (action === "pending") {
      if (appointment.paymentStatus !== "paid") {
        return sendError(res, 400, "Payment is not marked as paid");
      }
      await Payment.updateMany(
        { appointmentId: appointment._id },
        { status: "cancelled" }
      );
      appointment.paymentStatus = "pending";
      await appointment.save();
    } else {
      return sendError(res, 400, "Action must be 'paid' or 'pending'");
    }

    const updated = await appointment.populate([
      { path: "userId", select: "name email phone" },
      { path: "doctorId", select: "name specialization image" },
    ]);

    return sendSuccess(res, 200, "Clinic payment updated", updated);
  } catch (error) {
    next(error);
  }
};

const getDoctorDashboard = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const today = todayString();

    const [
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      pendingRequests,
      rejectedAppointments,
      totalPatients,
      earningsResult,
      todaysSchedule,
    ] = await Promise.all([
      Appointment.countDocuments({ doctorId }),
      Appointment.countDocuments({ doctorId, date: today, status: { $ne: "cancelled" } }),
      Appointment.countDocuments({
        doctorId,
        status: { $in: ["pending", "confirmed"] },
        date: { $gte: today },
      }),
      Appointment.countDocuments({ doctorId, status: "completed" }),
      Appointment.countDocuments({ doctorId, status: "cancelled" }),
      Appointment.countDocuments({ doctorId, status: "pending" }),
      Appointment.countDocuments({ doctorId, status: "rejected" }),
      Appointment.distinct("userId", { doctorId }),
      Appointment.aggregate([
        { $match: { doctorId, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$consultationFee" } } },
      ]),
      Appointment.find({ doctorId, date: today, status: { $ne: "cancelled" } })
        .populate("userId", "name email phone image")
        .sort({ createdAt: -1 }),
    ]);

    return sendSuccess(res, 200, "Dashboard data retrieved successfully", {
      stats: {
        totalAppointments,
        todayAppointments,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
        pendingRequests,
        rejectedAppointments,
        totalPatients: totalPatients.length,
        totalEarnings: earningsResult[0]?.total || 0,
      },
      todaysSchedule,
      today,
    });
  } catch (error) {
    next(error);
  }
};

const updateDoctorAvailability = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    const updatableFields = [
      "isAvailable",
      "availableDays",
      "availableSlots",
      "workingHours",
      "breakTimings",
      "blockedDates",
      "appointmentDuration",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();

    return sendSuccess(res, 200, "Availability updated successfully", {
      _id: doctor._id,
      isAvailable: doctor.isAvailable,
      availableDays: doctor.availableDays,
      availableSlots: doctor.availableSlots,
      workingHours: doctor.workingHours,
      breakTimings: doctor.breakTimings,
      blockedDates: doctor.blockedDates,
      appointmentDuration: doctor.appointmentDuration,
    });
  } catch (error) {
    next(error);
  }
};

export {
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  changeDoctorPassword,
  getDoctorAppointments,
  getDoctorAppointmentById,
  updateAppointmentStatus,
  updateAppointmentNotes,
  getDoctorPayments,
  markClinicPayment,
  getDoctorDashboard,
  updateDoctorAvailability,
};
