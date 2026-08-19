import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getMeeting,
  recordMeetingEvent,
} from "../controllers/meetingController.js";

const router = express.Router();

router.get("/:appointmentId", protect, getMeeting);
router.post("/:appointmentId/history", protect, recordMeetingEvent);

export default router;
