import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import patientDoctorRoutes from "./routes/patientDoctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import emrRoutes from "./routes/emrRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import aiAssistantRoutes from "./routes/aiAssistantRoutes.js";
import errorHandler from "./middleware/errorMiddleware.js";
import { requestId } from "./utils/logger.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import config from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust proxy headers behind a reverse proxy (needed for accurate rate limiting)
if (config.isProduction) {
  app.set("trust proxy", 1);
}

// Request ID + logging
app.use(requestId);
app.use(
  morgan(config.isProduction ? "combined" : "dev", {
    skip: (req) => req.path === "/",
  })
);

// Security headers.
// CSP is intentionally not set: the patient meeting page loads the Jitsi
// external API script from meet.jit.si. Add a CSP only after auditing that flow.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(compression());

// CORS — restrict to the configured frontends (dev ports always allowed)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Stripe webhook needs the raw body for signature verification (must run before express.json)
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

// API rate limiting (applies to API calls only)
app.use("/api", generalLimiter);

// Static uploads — immutable cache headers so browsers can reuse them
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    immutable: true,
    index: false,
  })
);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Appointment Booking API is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", patientDoctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/emr", emrRoutes);
app.use("/api/doctor/emr", emrRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/doctor/meetings", meetingRoutes);
app.use("/api/assistant", aiAssistantRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
