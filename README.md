# DocBook — Doctor Appointment Booking System

A full-stack platform where patients can find doctors, book clinic or **video consultations**, pay online, and manage their medical records — while doctors manage their schedule, EMR (electronic medical records), and payments, and admins oversee everything through a rich analytics dashboard.

**This is a portfolio-grade production-ready application** — it includes security hardening, rate limiting, request logging, database indexing, lazy-loaded frontends with error boundaries, and analytics exports (PDF / Excel / CSV).

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Default Accounts](#default-accounts)
7. [API Reference](#api-reference)
8. [Analytics & Reports](#analytics--reports)
9. [Video Consultations](#video-consultations)
10. [AI Assistant](#ai-assistant)
11. [Security & Performance](#security--performance)
12. [Deployment](#deployment)
    - [Live URLs](#live-urls)
    - [Step-by-Step Guide](#step-by-step-deployment-guide)
    - [Why Render Failed](#why-render-failed-and-what-we-learned)
    - [MongoDB Atlas Connection Strings](#mongodb-atlas--direct-vs-srv-connection-strings)
    - [Environment Variables Reference](#environment-variables-reference)
    - [Auto-Deploy](#auto-deploy)
13. [Troubleshooting](#troubleshooting)

---

## Features

### Patient portal (`frontend/`)
- Browse doctors with search, specialization filter, and availability
- Doctor profiles with ratings, reviews, experience, and working hours
- Book **clinic** or **video** appointments with slot selection and rescheduling
- Online payment via **Stripe** (or demo mode — payments auto-confirmed)
- Payment history, downloadable PDF receipts
- Medical records with prescriptions (PDF), reports, and follow-up notes
- **AI Assistant** — symptom checker, FAQ answers, health tips, and smart doctor recommendations
- **Video consultations** powered by Jitsi
- Profile management and password change

### Doctor portal (`admin/` — doctor role)
- Dashboard with key stats
- Availability & schedule management (days, slots, blocked dates, breaks)
- Appointment management with status updates, notes, and clinic-payment marking
- **EMR** — create/update medical records, prescriptions, upload reports, follow-up notes
- Payment history and payment report
- **Video consultations** from the doctor side

### Admin portal (`admin/` — admin role)
- Dashboard and **analytics** (trends, revenue, peak hours, doctor performance, exports)
- Doctor CRUD with image upload (auto-optimized to WebP)
- Patient management (activate / deactivate)
- Appointment and payment management, refunds
- Payment reports and settings

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Backend    | Node.js, Express, Mongoose (MongoDB) |
| Auth       | JWT + bcrypt, httpOnly cookies |
| Payments   | Stripe Checkout (demo fallback) |
| Reports    | PDFKit (PDF), ExcelJS (XLSX), CSV |
| Images     | Sharp (WebP optimization) |
| Email      | Nodemailer (SMTP / console fallback) |
| Frontend   | React 18 + Vite, React Router, Axios |
| Admin/Doctor | React 18 + Vite, Recharts, Axios |
| Security   | Helmet, CORS allowlist, express-rate-limit, compression, morgan, request IDs |
| Video      | Jitsi Meet (external API) |

---

## Project Structure

```
doctor-appointment-system/
├── backend/                    # Express + MongoDB API
│   ├── config/                 # env.js (validated config), db.js (mongoose)
│   ├── controllers/            # Route handlers (auth, doctor, admin, emr, meeting…)
│   ├── middleware/             # auth, role, errorHandler, rateLimiters
│   ├── models/                 # Mongoose schemas with indexes
│   ├── routes/                 # Express routers
│   ├── scripts/                # seed.js (sample data)
│   ├── services/               # email, payment, analytics, analyticsExporter, aiAssistant
│   ├── utils/                  # logger, fileUpload, emrUpload, apiResponse, imageProcessor
│   ├── uploads/                # Doctor profile images (served statically, cached)
│   ├── medical-files/          # EMR files (served ONLY via authenticated endpoints)
│   ├── app.js                  # Express app (helmet, compression, rate limits, CORS)
│   ├── server.js               # Graceful shutdown + startup
│   └── .env.example            # Copy to .env and fill in
│
├── frontend/                   # Patient web app (Vite, React 18)
│   └── src/
│       ├── components/         # Navbar, Footer, DoctorCard, ErrorBoundary, Loading…
│       ├── context/            # AuthContext, ToastContext
│       ├── layouts/            # PublicLayout
│       ├── pages/              # Home, Doctors, DoctorProfile, Booking, Payments…
│       ├── routes/             # ProtectedRoute, PublicOnlyRoute
│       └── utils/              # axiosClient, errorHandler
│
├── admin/                      # Admin + Doctor dashboard (Vite, React 18)
│   └── src/
│       ├── components/         # Sidebar, DoctorLayout, ErrorBoundary, DoctorUI
│       ├── context/            # ToastContext
│       ├── pages/              # Dashboard, Analytics, Doctors, Patients, EMR, Doctor…
│       └── utils/              # axiosClient
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (tested on 24.x)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a connection URI

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env      # Windows — or: cp .env.example .env
npm run dev                 # starts API on http://localhost:5000
```

Optional sample data (creates admin, doctors, and a demo patient):

```bash
npm run seed
```

> ⚠️ `npm run seed` is a one-shot data generator. Run it against a fresh/throwaway
> database only — it overwrites existing doctor records.

### 2. Patient frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### 3. Admin / Doctor frontend

```bash
cd admin
npm install
npm run dev                 # http://localhost:5174
```

### Production builds

```bash
# backend
npm start                   # NODE_ENV=production recommended

# frontend
npm run build               # outputs to dist/

# admin
npm run build
```

---

## Environment Variables

All variables are documented in `backend/.env.example`. The most important ones:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ | — | MongoDB connection string |
| `JWT_SECRET` | ✅ (prod) | dev fallback | Long random string — `openssl rand -hex 32` |
| `PORT` | | `5000` | API port |
| `NODE_ENV` | | `development` | `production` enables strict validation & secure cookies |
| `JWT_EXPIRE` | | `7d` | Token lifetime |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | | — | Seeded admin credentials |
| `FRONTEND_URL` | | `http://localhost:5173` | Used by payments & email links |
| `CORS_ORIGINS` | | dev ports | Comma-separated extra allowed origins |
| `STRIPE_SECRET_KEY` | | empty → demo mode | Stripe live/test key |
| `STRIPE_WEBHOOK_SECRET` | | empty | Webhook signature secret |
| `STRIPE_CURRENCY` | | `PKR` | Default currency |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | | empty → console | Email delivery |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` / `RATE_LIMIT_AUTH_MAX` | | `60000` / `300` / `10` | Rate limiting overrides |

---

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| Doctor | `michael@example.com` | `doctor123` |
| Patient | `patient@example.com` | `patient123` |

---

## API Reference

All responses follow the envelope shape:

```json
{ "success": true, "message": "...", "data": { ... } }
```

Errors use `{ "success": false, "message": "...", "stack": "…" }` (stack omitted in production).

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a patient (rate-limited) |
| POST | `/api/auth/login` | — | Patient login (rate-limited) |
| POST | `/api/auth/logout` | — | Clear auth cookie |
| GET | `/api/auth/me` | user | Current profile |
| PUT | `/api/auth/profile` | user | Update profile |
| PUT | `/api/auth/change-password` | user | Change password |

### Doctors — `/api/doctors` (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List doctors (search / specialization / availability / pagination) |
| GET | `/api/doctors/:id` | Doctor detail |
| GET | `/api/doctors/specializations` | All specializations |
| GET | `/api/doctors/stats` | Doctor count / specialization stats |

### Appointments — `/api/appointments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/appointments` | user | Book appointment |
| GET | `/api/appointments/my` | user | My appointments (paginated) |
| GET | `/api/appointments/:id` | user/doctor | Appointment detail |
| PUT | `/api/appointments/:id/reschedule` | user | Reschedule |
| PATCH | `/api/appointments/:id/cancel` | user | Cancel |

### Payments — `/api/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/checkout` | user | Create Stripe Checkout session |
| GET | `/api/payments/history` | user | My payments |
| GET | `/api/payments/appointment/:appointmentId` | user | Payment for an appointment |
| GET | `/api/payments/:id` | user | Payment detail |
| POST | `/api/payments/:id/refund` | admin | Refund a payment |
| POST | `/api/payments/webhook` | Stripe | Stripe webhook (raw body) |

### Reviews — `/api/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews/doctor/:doctorId` | — | Reviews for a doctor |
| GET | `/api/reviews/my/:doctorId` | user | My review for a doctor |
| POST | `/api/reviews` | user | Create review |
| DELETE | `/api/reviews/:id` | user | Delete review |

### Doctor — `/api/doctor`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctor/login` | Doctor login |
| GET | `/api/doctor/profile` | Profile |
| PUT | `/api/doctor/profile` | Update profile (image upload) |
| PUT / PATCH | `/api/doctor/change-password` | Change password |
| GET | `/api/doctor/dashboard` | Doctor dashboard stats |
| PATCH | `/api/doctor/availability` | Update availability |
| GET | `/api/doctor/appointments` | Appointments list |
| GET | `/api/doctor/appointments/:id` | Appointment detail |
| PATCH | `/api/doctor/appointments/:id` | Update status / notes / clinic payment |
| GET | `/api/doctor/payments` | Payment history |
| GET | `/api/doctor/payments/report` | Payment report |

### EMR — `/api/emr` (also aliased under `/api/doctor/emr`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/emr/records` | doctor/admin | List records |
| POST | `/api/emr/records` | doctor | Create record |
| PUT | `/api/emr/records/:id` | doctor | Update record |
| DELETE | `/api/emr/records/:id` | doctor | Delete record |
| POST | `/api/emr/records/:id/reports` | doctor | Upload reports (up to 5) |
| DELETE | `/api/emr/records/:id/reports/:reportId` | doctor | Delete a report |
| POST | `/api/emr/records/:id/followup` | doctor | Add follow-up note |
| POST | `/api/emr/records/:id/prescription-pdf` | doctor | Upload prescription PDF |
| GET | `/api/emr/patients` | doctor | Doctor's patients |
| GET | `/api/emr/my-records` | user | Patient's records |
| GET | `/api/emr/records/:id/prescription` | doctor/admin/user | Download prescription PDF |
| GET | `/api/emr/records/:id/reports/:reportId` | doctor/admin/user | Download report |

> EMR files are stored under `backend/medical-files/` and are **only** streamed through
> these authenticated endpoints — they are never served as static files.

### Meetings — `/api/meetings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/meetings/:appointmentId` | user/doctor | Get meeting room + Jitsi token |
| POST | `/api/meetings/:appointmentId/history` | user/doctor | Record join/leave/duration |

### AI Assistant — `/api/assistant`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assistant/symptom-check` | Symptom severity check (rate-limited) |
| POST | `/api/assistant/chat` | Chat: FAQs, health tips, specialist matching (rate-limited) |
| GET | `/api/assistant/faqs` | FAQ list |
| GET | `/api/assistant/health-tips` | Health tips |

### Admin — `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (rate-limited) |
| GET | `/api/admin/profile` | Profile |
| PUT | `/api/admin/profile` | Update profile |
| PATCH | `/api/admin/change-password` | Change password |
| GET | `/api/admin/dashboard` | Dashboard KPIs |
| GET | `/api/admin/analytics` | Analytics (see below) |
| GET | `/api/admin/analytics/export` | Export report (see below) |
| GET/POST/PUT/DELETE | `/api/admin/doctors…` | Doctor CRUD (+ status toggle, image upload) |
| GET/PATCH/DELETE | `/api/admin/appointments…` | Appointment management |
| GET/PATCH/DELETE | `/api/admin/patients…` | Patient management |
| GET/PATCH | `/api/admin/payments…` | Payment management + refunds |
| GET | `/api/admin/payments/report` | Payment report |

---

## Analytics & Reports

`GET /api/admin/analytics?period=7d|30d|3m|6m|12m|all` (default `30d`) returns:

- **stats** — totals, earnings, completion/cancellation rate, video & online-payment share, peak hour/day
- **daily / weekly / monthly** — appointment & revenue trends
- **statusDistribution / revenueByStatus / revenueByType / revenueByMethod**
- **revenueBySpecialization / revenueByDoctor**
- **patientGrowth**, **doctorPerformance**, **mostBookedDoctors**, **topSpecializations**
- **peakHours**, **dayOfWeek**, **generatedAt**

`GET /api/admin/analytics/export?format=pdf|xlsx|csv&period=…` downloads a formatted report
(CSV includes a UTF-8 BOM; Excel has multiple styled sheets; PDF is paginated).

The analytics UI lives at **Admin → Analytics**.

---

## Video Consultations

- Built on **Jitsi Meet** (`https://meet.jit.si/external_api.js`).
- The backend issues a signed Jitsi JWT token per meeting (see `utils/meetingUtil.js` and the meeting routes) and records join/leave/duration history on the appointment.
- Patient joins from `frontend` → `VideoConsultation`; doctor from `admin` → `DoctorVideoConsultation`.
- Only the patient and the assigned doctor can join a room.

---

## AI Assistant

A **local rules engine** (no external LLM key required) in `services/aiAssistantService.js`:

- **Symptom check** — maps symptoms to body systems and severity with triage advice
- **Chat** — intent detection with stop-word filtering and token-scored FAQ matching; specialist mentions are routed to matching doctors before FAQ lookup
- **Health tips** — rotating daily tips

---

## Security & Performance

- **Helmet** security headers (CSP intentionally off — the Jitsi script is loaded cross-origin; see comment in `app.js`)
- **CORS allowlist** via `CORS_ORIGINS` + dev ports
- **Rate limiting** — global (`300/60s`), auth (`10/min`, skips successes), assistant (`30/min`)
- **Request IDs** + structured logging (`utils/logger.js`) + morgan access logs
- **Graceful shutdown** on SIGTERM / SIGINT
- **Strict env validation** — startup aborts in production when required vars are missing
- **Upload hardening** — size limits (images 5 MB, reports 15 MB), extension filtering, and **Sharp auto-optimization** of doctor photos to ≤600px WebP
- **Structured indexes** on Appointment, Payment, Review, User, Doctor for the hot query paths; `autoIndex` disabled in production
- **Express compression** + immutable cache headers for `/uploads`
- **Code splitting** — both frontends lazy-load every page; React, Router, Axios, and Recharts are split into cached vendor chunks
- **Error boundaries** on both frontends with retry UI

---

## Deployment

### Live URLs

| App | Platform | URL |
|-----|----------|-----|
| Backend API | Railway | https://docbook-api-production.up.railway.app |
| Patient Frontend | Vercel | https://frontend-bay-alpha-18.vercel.app |
| Admin Portal | Vercel | https://admin-five-rho-74.vercel.app |

### Architecture Overview

```
                          ┌─────────────────────────┐
                          │     MongoDB Atlas (DB)   │
                          └────────────┬────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │   Railway (Backend API)  │
                          │   docbook-api-production │
                          └──┬──────────────────┬───┘
                             │                  │
                ┌────────────┴──┐        ┌──────┴────────────┐
                │  Vercel       │        │  Vercel            │
                │  (Frontend)   │        │  (Admin Portal)    │
                │  /frontend    │        │  /admin             │
                └───────────────┘        └───────────────────┘
```

All three apps are connected to the same GitHub repo (`Ganpatdarzi/Doctorapp`) and auto-deploy on push to `main`.

---

### Step-by-Step Deployment Guide

#### Prerequisites

- Node.js 18+ installed
- A MongoDB Atlas account with a cluster created
- A GitHub account
- A Vercel account (free tier)
- A Railway account (free $5/month credit)

---

#### Step 1 — Set Up MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and log in.
2. Create a cluster (Free M0 tier works).
3. Create a database user: **Database Access** → Add a new user with username/password.
4. Set network access: **Network Access** → **Add IP Address** → **"Allow Access from Anywhere"** (`0.0.0.0/0`).
   > **Critical:** If you only add your local IP, cloud servers (Railway/Vercel) will be blocked.
5. Get your connection string: **Connect** → **Drivers** → select Node.js → copy the URI.
6. Add your database name after `.net/`:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/doctor-appointment?retryWrites=true&w=majority
   ```

---

#### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<repo>.git
git push -u origin main
```

Make sure `.gitignore` excludes `backend/.env`, `node_modules/`, `uploads/`, and `medical-files/`.

---

#### Step 3 — Deploy Backend on Railway

**Why Railway?** We originally tried Render, but it now requires a credit card even for the free tier. Railway provides $5/month free credit with no card required.

**Why a Dockerfile?** Railway's new build system (Railpack) requires a `package.json` at the repo root to detect Node.js. Since this is a monorepo with separate `backend/`, `frontend/`, and `admin/` directories, we use a Dockerfile that builds only the backend:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
EXPOSE 5000
CMD ["node", "server.js"]
```

**Steps:**

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Log in:
   ```bash
   railway login
   ```

3. Create a project and service:
   ```bash
   railway init --name docbook-api
   railway add --repo <your-username>/<repo> --branch main --service docbook-api
   ```

4. Set environment variables:
   ```bash
   railway variable set \
     "NODE_ENV=production" \
     "MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/doctor-appointment?retryWrites=true&w=majority" \
     "JWT_SECRET=<generate-a-strong-secret>" \
     "JWT_EXPIRE=7d" \
     "ADMIN_EMAIL=admin@example.com" \
     "ADMIN_PASSWORD=admin123" \
     "FRONTEND_URL=https://<your-frontend>.vercel.app" \
     "CORS_ORIGINS=https://<your-frontend>.vercel.app,https://<your-admin>.vercel.app"
   ```

5. Deploy:
   ```bash
   railway up --service docbook-api
   ```

6. Generate a public domain:
   ```bash
   railway domain --service docbook-api
   ```
   This gives you a URL like `https://docbook-api-production.up.railway.app`.

7. Verify:
   ```bash
   curl https://docbook-api-production.up.railway.app/
   # → {"success":true,"message":"Doctor Appointment Booking API is running"}
   ```

---

#### Step 4 — Deploy Frontend on Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. From the `frontend/` directory:
   ```bash
   cd frontend
   vercel deploy --prod
   ```

3. Set the API URL environment variable:
   ```bash
   echo "https://docbook-api-production.up.railway.app/api" | \
     vercel env add VITE_API_URL production
   ```

4. Redeploy to bake in the env var (Vite inlines `import.meta.env` at build time):
   ```bash
   vercel deploy --prod
   ```

---

#### Step 5 — Deploy Admin Portal on Vercel

Same process as the frontend:
```bash
cd admin
vercel deploy --prod

echo "https://docbook-api-production.up.railway.app/api" | \
  vercel env add VITE_API_URL production

vercel deploy --prod
```

---

#### Step 6 — Update Backend CORS

After the frontend/admin are deployed, update the backend with the actual URLs:

```bash
railway variable set \
  "FRONTEND_URL=https://<your-frontend>.vercel.app" \
  "CORS_ORIGINS=https://<your-frontend>.vercel.app,https://<your-admin>.vercel.app" \
  --service docbook-api
```

Railway auto-redeploys on variable changes.

---

### Why Render Failed (and What We Learned)

| Step | What Happened | Root Cause | Solution |
|------|--------------|------------|----------|
| **SRV DNS** | `querySrv ECONNREFUSED _mongodb._tcp.doctorapp.fhscnms.mongodb.net` | The local DNS resolver (`192.168.0.1`) couldn't resolve MongoDB Atlas SRV records | Added `dns.setServers(["8.8.8.8"])` in `db.js` to use Google DNS |
| **IP Whitelist** | `Could not connect to any servers in your MongoDB Atlas cluster` | Atlas only had the local IP whitelisted; cloud servers were blocked | Set Atlas Network Access to `0.0.0.0/0` |
| **Render API** | `Payment information is required` | Render now requires a credit card even for the Free plan | Switched to **Railway** ($5 free credit, no card) |
| **Railway Build 1** | `npm: command not found` | Railway's Railpack couldn't detect Node.js — no `package.json` at repo root | Created a `Dockerfile` to explicitly build from `backend/` |
| **Railway Build 2** | `Railpack could not determine how to build the app` | Same root cause — monorepo without a root `package.json` | Dockerfile approach solved this |

### MongoDB Atlas — Direct vs SRV Connection Strings

The DNS SRV issue affects Docker containers and some Windows systems. Two approaches:

**Option A — SRV string (simpler, needs DNS fix):**
```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/doctor-appointment?retryWrites=true&w=majority
```

**Option B — Direct string (works everywhere, no DNS issues):**
```
mongodb://<user>:<password>@shard-00-00.xxxxx.mongodb.net:27017,shard-00-01.xxxxx.mongodb.net:27017,shard-00-02.xxxxx.mongodb.net:27017/doctor-appointment?retryWrites=true&w=majority&authSource=admin
```

The direct string bypasses SRV resolution entirely. Use `nslookup -type=SRV _mongodb._tcp.<cluster>` to discover your shard hostnames.

> **Note:** The `dns.setServers(["8.8.8.8"])` fix in `backend/config/db.js` handles the SRV issue for local development. For production Docker builds, the direct connection string is more reliable.

---

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port (Railway sets this automatically) |
| `NODE_ENV` | Yes | `development` | Set to `production` for deployed environments |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Strong random string for JWT signing |
| `JWT_EXPIRE` | No | `7d` | Token expiry duration |
| `ADMIN_EMAIL` | No | `admin@example.com` | Default admin email |
| `ADMIN_PASSWORD` | No | `admin123` | Default admin password |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Deployed frontend URL for CORS |
| `CORS_ORIGINS` | No | — | Comma-separated extra allowed origins |
| `VITE_API_URL` | Yes (frontend) | `http://localhost:5000/api` | Backend API URL (Vercel env var) |

---

### Auto-Deploy

Both Railway and Vercel are connected to the GitHub repo. Every push to `main` triggers:
- **Railway** → rebuilds the Docker image and redeploys the backend
- **Vercel** → rebuilds the frontend/admin with latest code

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `querySrv ECONNREFUSED` | DNS SRV resolution failing — use direct connection string or add `dns.setServers(["8.8.8.8"])` |
| `Could not connect to any servers` | Atlas IP not whitelisted — set Network Access to `0.0.0.0/0` |
| `application failed to respond` (502) | Backend crashed — check Railway logs with `railway logs` |
| Vercel shows `localhost:5000/api` | `VITE_API_URL` not set at build time — set it and redeploy |
| CORS errors from the frontend | Add the frontend origin to `CORS_ORIGINS` (dev ports are pre-allowed) |
| Login returns 429 | Auth rate limit hit — wait a minute (or raise `RATE_LIMIT_AUTH_MAX`) |
| `npm run seed` removed doctors | Never run it against real data — it resets doctor collections |
| Stripe checkout fails | `STRIPE_SECRET_KEY` empty → demo mode auto-confirms payments |
| Emails not sending | Empty `SMTP_*` → emails are logged to the console instead |
| Port 5000 already in use | Change `PORT` or kill the stale process |

---

## License

ISC — for educational / portfolio use.
