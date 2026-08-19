import express from "express";
import {
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
} from "../controllers/adminController.js";
import {
  getAnalytics,
  exportAnalytics,
} from "../controllers/analyticsController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import upload from "../utils/fileUpload.js";
import {
  adminGetPayments,
  adminGetPaymentById,
  adminUpdatePayment,
  refundPayment,
  getAdminPaymentReport,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/profile", protect, authorize("admin"), getAdminProfile);

router.get("/doctors", protect, authorize("admin"), getAllDoctors);
router.get("/doctors/:id", protect, authorize("admin"), getDoctorById);
router.post("/doctors", protect, authorize("admin"), upload.single("image"), addDoctor);
router.put("/doctors/:id", protect, authorize("admin"), upload.single("image"), updateDoctor);
router.delete("/doctors/:id", protect, authorize("admin"), deleteDoctor);
router.patch("/doctors/:id/status", protect, authorize("admin"), toggleDoctorStatus);

router.get("/appointments", protect, authorize("admin"), getAllAppointments);
router.get("/appointments/:id", protect, authorize("admin"), getAppointmentById);
router.patch("/appointments/:id/status", protect, authorize("admin"), updateAppointmentStatus);
router.delete("/appointments/:id", protect, authorize("admin"), deleteAppointment);

router.get("/dashboard", protect, authorize("admin"), getAdminDashboard);
router.get("/analytics", protect, authorize("admin"), getAnalytics);
router.get("/analytics/export", protect, authorize("admin"), exportAnalytics);

router.get("/patients", protect, authorize("admin"), getAllPatients);
router.get("/patients/:id", protect, authorize("admin"), getPatientById);
router.patch("/patients/:id/status", protect, authorize("admin"), togglePatientStatus);
router.delete("/patients/:id", protect, authorize("admin"), deletePatient);

router.get("/payments", protect, authorize("admin"), adminGetPayments);
router.get("/payments/report", protect, authorize("admin"), getAdminPaymentReport);
router.get("/payments/:id", protect, authorize("admin"), adminGetPaymentById);
router.patch("/payments/:id", protect, authorize("admin"), adminUpdatePayment);
router.post("/payments/:id/refund", protect, authorize("admin"), refundPayment);

router.put("/profile", protect, authorize("admin"), updateAdminProfile);
router.patch("/change-password", protect, authorize("admin"), changeAdminPassword);

export default router;
