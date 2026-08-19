import express from "express";
import {
  getAllDoctors,
  getDoctorById,
  getSpecializations,
  getStats,
} from "../controllers/patientDoctorController.js";

const router = express.Router();

router.get("/stats", getStats);
router.get("/specializations", getSpecializations);
router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);

export default router;
