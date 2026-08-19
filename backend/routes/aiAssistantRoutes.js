import express from "express";
import {
  symptomCheck,
  chat,
  faqs,
  healthTips,
} from "../controllers/aiAssistantController.js";

import { assistantLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/symptom-check", assistantLimiter, symptomCheck);
router.post("/chat", assistantLimiter, chat);
router.get("/faqs", faqs);
router.get("/health-tips", healthTips);

export default router;
