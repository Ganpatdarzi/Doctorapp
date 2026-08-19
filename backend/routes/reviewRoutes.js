import express from "express";
import {
  createReview,
  deleteReview,
  getDoctorReviews,
  getMyReviewForDoctor,
} from "../controllers/reviewController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/doctor/:doctorId", getDoctorReviews);
router.get("/my/:doctorId", protect, authorize("user"), getMyReviewForDoctor);
router.post("/", protect, authorize("user"), createReview);
router.delete("/:id", protect, authorize("user"), deleteReview);

export default router;
