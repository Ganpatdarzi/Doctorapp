import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import generateToken from "../utils/generateToken.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { sendAppointmentStatusEmail } from "../services/emailService.js";
import { optimizeUploadedImage } from "../utils/imageProcessor.js";

const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const errors = [];
    if (!email || !email.trim()) errors.push("Email is required");
    if (!password) errors.push("Password is required");

    if (errors.length > 0) {
      return sendError(res, 400, "Validation failed", errors);
    }

    if (
      email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase() ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return sendError(res, 401, "Invalid admin credentials");
    }

    let admin = await User.findOne({
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      role: "admin",
    });

    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

      admin = await User.create({
        name: "Admin",
        email: process.env.ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        role: "admin",
      });
    }

    const token = generateToken(admin._id, "admin");

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, 200, "Admin login successful", {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id).select("-password");

    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    return sendSuccess(res, 200, "Admin profile retrieved successfully", admin);
  } catch (error) {
    next(error);
  }
};

const addDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      experience,
      fees,
      phone,
      gender,
      dob,
      education,
      location,
      hospital,
      address,
      about,
      languages,
      availableDays,
      availableSlots,
    } = req.body;

    const errors = [];
    if (!name || !name.trim()) errors.push("Name is required");
    if (!email || !email.trim()) errors.push("Email is required");
    if (!password) errors.push("Password is required");
    else if (password.length < 6) errors.push("Password must be at least 6 characters");
    if (!specialization || !specialization.trim()) errors.push("Specialization is required");
    if (experience === undefined || experience === null || experience === "") errors.push("Experience is required");
    if (fees === undefined || fees === null || fees === "") errors.push("Consultation fee is required");

    if (errors.length > 0) {
      return sendError(res, 400, "Validation failed", errors);
    }

    const existing = await Doctor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendError(res, 409, "A doctor with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const doctor = await Doctor.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      specialization: specialization.trim(),
      experience: Number(experience),
      fees: Number(fees),
      phone: phone || "",
      gender: gender || "",
      dob: dob || "",
      education: education || "",
      location: location || "",
      hospital: hospital || "",
      address: address || "",
      about: about || "",
      languages: languages || [],
      availableDays: availableDays || [],
      availableSlots: availableSlots || [],
      image: req.file ? `/uploads/${await optimizeUploadedImage(req.file.path)}` : "",
    });

    return sendSuccess(res, 201, "Doctor added successfully", {
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
    });
  } catch (error) {
    next(error);
  }
};

const getAllDoctors = async (req, res, next) => {
  try {
    const {
      search,
      specialization,
      availability,
      isAvailable,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    if (specialization) {
      query.specialization = specialization;
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === "true";
    }

    if (availability) {
      query.availableDays = { $in: [availability] };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "name") sortOption = { name: 1 };
    if (sort === "name-desc") sortOption = { name: -1 };
    if (sort === "experience") sortOption = { experience: -1 };
    if (sort === "experience-asc") sortOption = { experience: 1 };
    if (sort === "fees") sortOption = { fees: -1 };
    if (sort === "fees-asc") sortOption = { fees: 1 };
    if (sort === "rating") sortOption = { rating: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select("-password")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Doctor.countDocuments(query),
    ]);

    return sendSuccess(res, 200, "Doctors retrieved successfully", {
      doctors,
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

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-password");

    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    return sendSuccess(res, 200, "Doctor retrieved successfully", doctor);
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    const updatableFields = [
      "name", "email", "specialization", "experience", "fees",
      "phone", "gender", "dob", "education", "location", "hospital",
      "address", "about", "languages", "availableDays", "availableSlots",
      "isAvailable", "isOnline", "rating", "reviews",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return sendError(res, 400, "Password must be at least 6 characters");
      }
      const salt = await bcrypt.genSalt(10);
      doctor.password = await bcrypt.hash(req.body.password, salt);
    }

    if (req.file) {
      doctor.image = `/uploads/${await optimizeUploadedImage(req.file.path)}`;
    }

    const updatedDoctor = await doctor.save();

    return sendSuccess(res, 200, "Doctor updated successfully", {
      _id: updatedDoctor._id,
      name: updatedDoctor.name,
      email: updatedDoctor.email,
      specialization: updatedDoctor.specialization,
      experience: updatedDoctor.experience,
      fees: updatedDoctor.fees,
      image: updatedDoctor.image,
      isAvailable: updatedDoctor.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    await Promise.all([
      Doctor.findByIdAndDelete(req.params.id),
      Appointment.deleteMany({ doctorId: req.params.id }),
      Payment.deleteMany({ doctorId: req.params.id }),
      Review.deleteMany({ doctorId: req.params.id }),
    ]);

    return sendSuccess(res, 200, "Doctor and their appointments deleted successfully");
  } catch (error) {
    next(error);
  }
};

const toggleDoctorStatus = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();

    return sendSuccess(res, 200, `Doctor ${doctor.isAvailable ? "activated" : "deactivated"} successfully`, {
      _id: doctor._id,
      name: doctor.name,
      isAvailable: doctor.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

const getAllAppointments = async (req, res, next) => {
  try {
    const {
      status,
      search,
      date,
      doctorId,
      patientId,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (date) {
      query.date = date;
    }

    if (doctorId) {
      query.doctorId = doctorId;
    }

    if (patientId) {
      query.userId = patientId;
    }

    if (search) {
      const regex = { $regex: search, $options: "i" };
      const [patients, doctors] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select("_id"),
        Doctor.find({ $or: [{ name: regex }, { specialization: regex }] }).select("_id"),
      ]);

      const matchingIds = [...patients, ...doctors].map((d) => d._id);
      if (matchingIds.length === 0) {
        return sendSuccess(res, 200, "Appointments retrieved", {
          appointments: [],
          pagination: { total: 0, page: Number(page), pages: 0 },
        });
      }
      query.$or = [{ userId: { $in: matchingIds } }, { doctorId: { $in: matchingIds } }];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "date") sortOption = { date: 1, timeSlot: 1 };
    if (sort === "date-desc") sortOption = { date: -1, timeSlot: 1 };

    const total = await Appointment.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const results = await Appointment.find(query)
      .populate("userId", "name email phone image isActive")
      .populate("doctorId", "name specialization image email")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

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
      .populate("userId", "name email phone dob gender address image isActive")
      .populate("doctorId", "name specialization image email phone fees");

    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    return sendSuccess(res, 200, "Appointment retrieved", appointment);
  } catch (error) {
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const validStatuses = ["pending", "confirmed", "completed", "cancelled", "rejected"];

    if (!status || !validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    appointment.status = status;
    if (status === "cancelled" && cancellationReason) {
      appointment.cancellationReason = cancellationReason;
    }
    if (status === "completed") {
      appointment.paymentStatus = "paid";
    }

    await appointment.save();

    const updated = await appointment.populate([
      { path: "userId", select: "name email phone" },
      { path: "doctorId", select: "name specialization image" },
    ]);

    sendAppointmentStatusEmail(updated, updated.userId?.email);

    return sendSuccess(res, 200, `Appointment status updated to ${status}`, updated);
  } catch (error) {
    next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    await Appointment.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 200, "Appointment deleted successfully");
  } catch (error) {
    next(error);
  }
};

/* -------------------- Helpers -------------------- */

const todayString = () => new Date().toLocaleDateString("en-CA");

const monthRange = (count) => {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    });
  }
  return months;
};

const toDateMap = (rows) => {
  const map = {};
  rows.forEach((r) => {
    if (r._id) map[r._id] = r.count;
  });
  return map;
};

/* -------------------- Dashboard -------------------- */

const getAdminDashboard = async (req, res, next) => {
  try {
    const today = todayString();

    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      earningsResult,
      monthlyRows,
      recentAppointments,
      recentDoctors,
    ] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: "user" }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: today, status: { $ne: "cancelled" } }),
      Appointment.countDocuments({ status: "pending" }),
      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "cancelled" }),
      Appointment.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$consultationFee" } } },
      ]),
      Appointment.aggregate([
        { $group: { _id: { $substr: ["$date", 0, 7] }, count: { $sum: 1 } } },
      ]),
      Appointment.find()
        .populate("userId", "name email phone image")
        .populate("doctorId", "name specialization image")
        .sort({ createdAt: -1 })
        .limit(5),
      Doctor.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const monthMap = toDateMap(monthlyRows);
    const monthlyAppointments = monthRange(12).map((m) => ({
      label: m.label,
      count: monthMap[m.key] || 0,
    }));

    return sendSuccess(res, 200, "Dashboard data retrieved successfully", {
      stats: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        totalEarnings: earningsResult[0]?.total || 0,
      },
      monthlyAppointments,
      recentAppointments,
      recentDoctors,
      today,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Patients -------------------- */

const getAllPatients = async (req, res, next) => {
  try {
    const { search, status, sort, page = 1, limit = 10 } = req.query;

    let query = { role: "user" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "name") sortOption = { name: 1 };
    if (sort === "name-desc") sortOption = { name: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [patients, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return sendSuccess(res, 200, "Patients retrieved successfully", {
      patients,
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

const getPatientById = async (req, res, next) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: "user" }).select("-password");

    if (!patient) {
      return sendError(res, 404, "Patient not found");
    }

    const appointments = await Appointment.find({ userId: patient._id })
      .populate("doctorId", "name specialization image")
      .sort({ createdAt: -1 });

    const stats = {
      total: appointments.length,
      completed: appointments.filter((a) => a.status === "completed").length,
      pending: appointments.filter((a) => a.status === "pending").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
    };

    return sendSuccess(res, 200, "Patient retrieved successfully", {
      patient,
      appointments,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

const togglePatientStatus = async (req, res, next) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: "user" });

    if (!patient) {
      return sendError(res, 404, "Patient not found");
    }

    const nextStatus = req.body.status !== undefined
      ? req.body.status === "true"
      : !patient.isActive;

    patient.isActive = nextStatus;
    await patient.save();

    return sendSuccess(res, 200, `Patient ${nextStatus ? "activated" : "deactivated"} successfully`, {
      _id: patient._id,
      name: patient.name,
      isActive: patient.isActive,
    });
  } catch (error) {
    next(error);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: "user" });

    if (!patient) {
      return sendError(res, 404, "Patient not found");
    }

    await Promise.all([
      User.findByIdAndDelete(patient._id),
      Appointment.deleteMany({ userId: patient._id }),
      Payment.deleteMany({ userId: patient._id }),
    ]);

    return sendSuccess(res, 200, "Patient and their appointments deleted successfully");
  } catch (error) {
    next(error);
  }
};

/* -------------------- Analytics -------------------- */
/* Analytics moved to controllers/analyticsController.js
   using services/analyticsService.js (period filter, exports). */
/* -------------------- Admin account -------------------- */

const updateAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id);
    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    if (req.body.name !== undefined) admin.name = req.body.name.trim();
    if (req.body.phone !== undefined) admin.phone = req.body.phone;

    const updated = await admin.save();

    return sendSuccess(res, 200, "Profile updated successfully", {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
    });
  } catch (error) {
    next(error);
  }
};

const changeAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const errors = [];
    if (!currentPassword) errors.push("Current password is required");
    if (!newPassword) errors.push("New password is required");
    else if (newPassword.length < 6) errors.push("New password must be at least 6 characters");

    if (errors.length > 0) {
      return sendError(res, 400, "Validation failed", errors);
    }

    const admin = await User.findById(req.user._id);
    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return sendError(res, 401, "Current password is incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    return sendSuccess(res, 200, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

export {
  loginAdmin,
  getAdminProfile,
  addDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  toggleDoctorStatus,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  getAdminDashboard,
  getAllPatients,
  getPatientById,
  togglePatientStatus,
  deletePatient,
  updateAdminProfile,
  changeAdminPassword,
};
