import express from "express";
import {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
} from "../controllers/appointmentController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("user"), bookAppointment);
router.get("/my", protect, authorize("user"), getMyAppointments);
router.get("/:id", protect, getAppointmentById);
router.put("/:id/reschedule", protect, authorize("user"), rescheduleAppointment);
router.patch("/:id/cancel", protect, authorize("user"), cancelAppointment);

export default router;
