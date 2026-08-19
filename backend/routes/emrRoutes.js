import express from "express";
import {
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
} from "../controllers/emrController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import { uploadReports, uploadPrescriptionPdf as pdfUpload } from "../utils/emrUpload.js";

const router = express.Router();

// Doctor-only
router.post("/records", protect, authorize("doctor"), createRecord);
router.put("/records/:id", protect, authorize("doctor"), updateRecord);
router.delete("/records/:id", protect, authorize("doctor"), deleteRecord);
router.post("/records/:id/reports", protect, authorize("doctor"), uploadReports.array("files", 5), addReports);
router.delete("/records/:id/reports/:reportId", protect, authorize("doctor"), deleteReport);
router.post("/records/:id/followup", protect, authorize("doctor"), addFollowUp);
router.post("/records/:id/prescription-pdf", protect, authorize("doctor"), pdfUpload.single("file"), uploadPrescriptionPdf);
router.get("/patients", protect, authorize("doctor"), listDoctorPatients);

// Doctor + Admin (list/view)
router.get("/records", protect, authorize("doctor", "admin"), listRecords);
router.get("/records/:id", protect, authorize("doctor", "admin"), getRecord);

// Patient-only
router.get("/my-records", protect, authorize("user"), getMyRecords);
router.get("/my-records/:id", protect, authorize("user"), getMyRecord);

// File access (all roles with proper ownership checks)
router.get("/records/:id/prescription", protect, authorize("doctor", "admin", "user"), getPrescriptionPdf);
router.get("/records/:id/reports/:reportId", protect, authorize("doctor", "admin", "user"), downloadReport);

export default router;
