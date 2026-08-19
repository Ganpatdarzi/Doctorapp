import express from "express";
import {
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
} from "../controllers/doctorController.js";
import { getDoctorPaymentReport } from "../controllers/paymentController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import upload from "../utils/fileUpload.js";

const router = express.Router();

router.post("/login", loginDoctor);
router.get("/profile", protect, authorize("doctor"), getDoctorProfile);
router.put("/profile", protect, authorize("doctor"), upload.single("image"), updateDoctorProfile);
router.put("/change-password", protect, authorize("doctor"), changeDoctorPassword);
router.patch("/change-password", protect, authorize("doctor"), changeDoctorPassword);

router.get("/dashboard", protect, authorize("doctor"), getDoctorDashboard);
router.patch("/availability", protect, authorize("doctor"), updateDoctorAvailability);
router.get("/payments", protect, authorize("doctor"), getDoctorPayments);
router.get("/payments/report", protect, authorize("doctor"), getDoctorPaymentReport);

router.get("/appointments", protect, authorize("doctor"), getDoctorAppointments);
router.patch("/appointments/:id/notes", protect, authorize("doctor"), updateAppointmentNotes);
router.patch("/appointments/:id/clinic-payment", protect, authorize("doctor"), markClinicPayment);
router.get("/appointments/:id", protect, authorize("doctor"), getDoctorAppointmentById);
router.patch("/appointments/:id", protect, authorize("doctor"), updateAppointmentStatus);

export default router;
