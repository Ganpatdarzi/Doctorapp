import fs from "fs";
import path from "path";
import MedicalRecord from "../models/MedicalRecord.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { generatePrescriptionPdf } from "../services/pdfService.js";
import { EMR_ROOT } from "../utils/emrUpload.js";

const toRel = (absPath) => path.relative(EMR_ROOT, absPath).replace(/\\/g, "/");
const absPath = (relPath) => (relPath ? path.join(EMR_ROOT, relPath) : null);

const unlinkIfExists = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Failed to delete file:", filePath, err.message);
  }
};

const cleanPrescriptions = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p) => ({
      medicine: String(p.medicine || "").trim(),
      dosage: String(p.dosage || "").trim(),
      frequency: String(p.frequency || "").trim(),
      duration: String(p.duration || "").trim(),
      instructions: String(p.instructions || "").trim(),
    }))
    .filter((p) => p.medicine);
};

const todayString = () => new Date().toLocaleDateString("en-CA");

const assertDoctorAccess = (record, req) => {
  if (record.doctorId.toString() !== req.user._id.toString()) {
    return "Not authorized to manage this medical record";
  }
  return null;
};

const assertReadAccess = (record, req) => {
  if (req.userRole === "admin") return null;
  if (req.userRole === "doctor") return assertDoctorAccess(record, req);
  if (record.userId.toString() !== req.user._id.toString()) {
    return "Not authorized to view this medical record";
  }
  return null;
};

const loadPopulated = (record) =>
  record.populate([
    { path: "userId", select: "name email phone dob gender address image" },
    { path: "doctorId", select: "name specialization image" },
    { path: "appointmentId", select: "date timeSlot status paymentStatus" },
  ]);

const generatePdfForRecord = async (record) => {
  const patient = await User.findById(record.userId);
  const doctor = await Doctor.findById(record.doctorId).select("-password");
  let appointment = null;
  if (record.appointmentId) {
    appointment = await Appointment.findById(record.appointmentId);
  }
  const pdf = await generatePrescriptionPdf({ record, doctor, patient, appointment });
  record.prescriptionPdf = {
    fileName: toRel(pdf.filePath),
    originalName: pdf.originalName,
    size: pdf.size,
  };
  return record;
};

// ---------- Doctor ----------

const createRecord = async (req, res, next) => {
  try {
    const { appointmentId, userId, diagnosis, treatmentPlan, visitDate, prescriptions } = req.body;

    let patientId = userId;
    let appointment = null;

    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return sendError(res, 404, "Appointment not found");
      }
      if (appointment.doctorId.toString() !== req.user._id.toString()) {
        return sendError(res, 403, "Not authorized to create a record for this appointment");
      }
      patientId = appointment.userId;
    }

    if (!patientId) {
      return sendError(res, 400, "Patient is required");
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return sendError(res, 404, "Patient not found");
    }

    const record = await MedicalRecord.create({
      userId: patientId,
      doctorId: req.user._id,
      appointmentId: appointmentId || null,
      visitDate: visitDate || appointment?.date || todayString(),
      diagnosis: String(diagnosis || "").trim(),
      treatmentPlan: String(treatmentPlan || "").trim(),
      prescriptions: cleanPrescriptions(prescriptions),
      reports: [],
      followUpNotes: [],
    });

    await generatePdfForRecord(record);
    await record.save();

    await loadPopulated(record);
    return sendSuccess(res, 201, "Medical record created successfully", record);
  } catch (error) {
    next(error);
  }
};

const listRecords = async (req, res, next) => {
  try {
    const { search, doctorId, date, patientId, page = 1, limit = 10 } = req.query;

    let query = {};
    if (req.userRole === "doctor") {
      query.doctorId = req.user._id;
    }
    if (req.userRole === "admin" && doctorId) {
      query.doctorId = doctorId;
    }
    if (date) query.visitDate = date;
    if (patientId) query.userId = patientId;

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
        return sendSuccess(res, 200, "Medical records retrieved", {
          records: [],
          pagination: { total: 0, page: Number(page), pages: 0 },
        });
      }
      query.userId = { $in: patientIds };
    }

    const total = await MedicalRecord.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const records = await MedicalRecord.find(query)
      .populate("userId", "name email phone dob gender address image")
      .populate("doctorId", "name specialization image")
      .populate("appointmentId", "date timeSlot status paymentStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return sendSuccess(res, 200, "Medical records retrieved", {
      records,
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

const getRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertReadAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    await loadPopulated(record);
    return sendSuccess(res, 200, "Medical record retrieved", record);
  } catch (error) {
    next(error);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertDoctorAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    const { diagnosis, treatmentPlan, visitDate, prescriptions, appointmentId, regeneratePdf } = req.body;

    if (diagnosis !== undefined) record.diagnosis = String(diagnosis || "").trim();
    if (treatmentPlan !== undefined) record.treatmentPlan = String(treatmentPlan || "").trim();
    if (visitDate !== undefined) record.visitDate = String(visitDate || "");
    if (prescriptions !== undefined) record.prescriptions = cleanPrescriptions(prescriptions);
    if (appointmentId !== undefined) record.appointmentId = appointmentId || null;

    await record.save();

    if (!record.prescriptionPdf || regeneratePdf === true) {
      await generatePdfForRecord(record);
      await record.save();
    }

    await loadPopulated(record);
    return sendSuccess(res, 200, "Medical record updated successfully", record);
  } catch (error) {
    next(error);
  }
};

const deleteRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertDoctorAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    (record.reports || []).forEach((report) => unlinkIfExists(absPath(report.fileName)));
    unlinkIfExists(absPath(record.prescriptionPdf?.fileName));

    await record.deleteOne();
    return sendSuccess(res, 200, "Medical record deleted successfully");
  } catch (error) {
    next(error);
  }
};

const addReports = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertDoctorAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, "No files uploaded");
    }

    const newReports = req.files.map((file) => ({
      fileName: toRel(file.path),
      originalName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    }));

    record.reports.push(...newReports);
    await record.save();

    await loadPopulated(record);
    return sendSuccess(res, 200, "Reports uploaded successfully", record);
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertDoctorAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    const report = record.reports.id(req.params.reportId);
    if (!report) {
      return sendError(res, 404, "Report not found");
    }

    unlinkIfExists(absPath(report.fileName));
    record.reports.pull(report._id);
    await record.save();

    await loadPopulated(record);
    return sendSuccess(res, 200, "Report deleted successfully", record);
  } catch (error) {
    next(error);
  }
};

const addFollowUp = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return sendError(res, 400, "Note text is required");
    }

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertDoctorAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    record.followUpNotes.push({ text: String(text).trim(), createdAt: new Date() });
    await record.save();

    await loadPopulated(record);
    return sendSuccess(res, 200, "Follow-up note added successfully", record);
  } catch (error) {
    next(error);
  }
};

const uploadPrescriptionPdf = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertDoctorAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    if (!req.file) {
      return sendError(res, 400, "No PDF file uploaded");
    }

    if (record.prescriptionPdf?.fileName) {
      unlinkIfExists(absPath(record.prescriptionPdf.fileName));
    }

    record.prescriptionPdf = {
      fileName: toRel(req.file.path),
      originalName: req.file.originalname,
      size: req.file.size,
    };
    await record.save();

    await loadPopulated(record);
    return sendSuccess(res, 200, "Prescription PDF uploaded successfully", record);
  } catch (error) {
    next(error);
  }
};

const listDoctorPatients = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const userIds = await Appointment.distinct("userId", { doctorId: req.user._id });

    let query = { _id: { $in: userIds } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const patients = await User.find(query)
      .select("name email phone dob gender address image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return sendSuccess(res, 200, "Patients retrieved", {
      patients,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- Patient ----------

const getMyRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };
    const total = await MedicalRecord.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const records = await MedicalRecord.find(query)
      .populate("doctorId", "name specialization image")
      .populate("appointmentId", "date timeSlot status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return sendSuccess(res, 200, "Medical records retrieved", {
      records,
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

const getMyRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    if (record.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to view this medical record");
    }

    await loadPopulated(record);
    return sendSuccess(res, 200, "Medical record retrieved", record);
  } catch (error) {
    next(error);
  }
};

// ---------- File access ----------

const getPrescriptionPdf = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertReadAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    if (!record.prescriptionPdf) {
      return sendError(res, 404, "Prescription PDF not found");
    }

    const fullPath = absPath(record.prescriptionPdf.fileName);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return sendError(res, 404, "Prescription file not found on server");
    }

    if (req.query.download === "1") {
      return res.download(fullPath, record.prescriptionPdf.originalName);
    }
    return res.sendFile(fullPath);
  } catch (error) {
    next(error);
  }
};

const downloadReport = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return sendError(res, 404, "Medical record not found");
    }

    const denied = assertReadAccess(record, req);
    if (denied) {
      return sendError(res, 403, denied);
    }

    const report = record.reports.id(req.params.reportId);
    if (!report) {
      return sendError(res, 404, "Report not found");
    }

    const fullPath = absPath(report.fileName);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return sendError(res, 404, "Report file not found on server");
    }

    return res.download(fullPath, report.originalName);
  } catch (error) {
    next(error);
  }
};

export {
  createRecord,
  listRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  addReports,
  deleteReport,
  addFollowUp,
  uploadPrescriptionPdf,
  listDoctorPatients,
  getMyRecords,
  getMyRecord,
  getPrescriptionPdf,
  downloadReport,
};
