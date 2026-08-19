import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import {
  createCheckoutSession,
  handleWebhook,
  getPaymentForAppointment,
  getMyPayments,
  getPaymentById,
  refundPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/checkout", protect, createCheckoutSession);
router.get("/history", protect, getMyPayments);
router.get("/appointment/:appointmentId", protect, getPaymentForAppointment);
router.get("/:id", protect, getPaymentById);
router.post("/:id/refund", protect, authorize("admin"), refundPayment);
router.post("/webhook", handleWebhook);

export default router;
