import dotenv from "dotenv";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";

const required = [
  "MONGODB_URI",
  "JWT_SECRET",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[env] Missing required environment variable(s): ${missing.join(", ")}`
  );
  if (isProduction) {
    console.error("[env] Aborting startup in production mode.");
    process.exit(1);
  }
}

if (!isProduction && !process.env.JWT_SECRET) {
  console.warn("[env] JWT_SECRET not set — using an insecure development fallback.");
}

const config = {
  env,
  isProduction,
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-jwt-secret-change-me",
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  adminEmail: (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripeCurrency: process.env.STRIPE_CURRENCY || "PKR",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "Doctor Appointment <noreply@example.com>",
  },
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .concat(["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "300", 10),
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || "10", 10),
  },
};

export default config;
