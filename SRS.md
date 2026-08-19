# Software Requirements Specification (SRS)

## DocBook — Doctor Appointment Booking System

| | |
|---|---|
| **Document Version** | 1.0 |
| **Status** | Approved for implementation |
| **Product** | DocBook — Doctor Appointment Booking System |
| **Last Updated** | August 2026 |

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Scope
   - 1.3 Definitions, Acronyms, and Abbreviations
   - 1.4 References
   - 1.5 Document Conventions
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Classes and Characteristics
   - 2.4 Operating Environment
   - 2.5 Design and Implementation Constraints
   - 2.6 Assumptions and Dependencies
3. [External Interface Requirements](#3-external-interface-requirements)
   - 3.1 User Interfaces
   - 3.2 Software Interfaces
   - 3.3 Hardware Interfaces
   - 3.4 Communication Interfaces
4. [Functional Requirements](#4-functional-requirements)
   - 4.1 Requirement Format
   - 4.2 Authentication and Account Management
   - 4.3 Patient: Doctor Directory and Discovery
   - 4.4 Patient: Doctor Profile and Reviews
   - 4.5 Patient: Appointment Booking
   - 4.6 Patient: Rescheduling and Cancellation
   - 4.7 Payments
   - 4.8 Patient: Medical Records (EMR)
   - 4.9 Video Consultations
   - 4.10 AI Assistant
   - 4.11 Doctor Portal
   - 4.12 Admin Portal and Analytics
   - 4.13 Notifications and Email
   - 4.14 Cross-Cutting Platform Requirements
5. [Non-Functional Requirements](#5-non-functional-requirements)
   - 5.1 Performance
   - 5.2 Security
   - 5.3 Reliability and Availability
   - 5.4 Usability
   - 5.5 Maintainability
   - 5.6 Portability and Deployment
   - 5.7 Compliance, Legal, and Privacy
6. [Data Requirements](#6-data-requirements)
   - 6.1 Logical Data Model
   - 6.2 Entity Definitions
   - 6.3 Data Integrity Rules
7. [Business Rules](#7-business-rules)
8. [Traceability Matrix (Summary)](#8-traceability-matrix-summary)
9. [Appendices](#9-appendices)
   - Appendix A: API Endpoint Reference
   - Appendix B: Analytics Metrics and Periods
   - Appendix C: Environment Configuration
   - Appendix D: Default Accounts and Seed Data
   - Appendix E: Glossary (Expanded)

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and
non-functional requirements for **DocBook**, a full-stack doctor appointment booking
platform. It is intended for use by software engineers, testers, product owners, and
quality-assurance teams to understand, implement, verify, and maintain the system.

The document describes three integrated applications:

1. **Patient web portal** (`frontend/`)
2. **Admin and Doctor portal** (`admin/`)
3. **Backend REST API** (`backend/`)

## 1.2 Scope

### 1.2.1 In-Scope

- Patient registration, authentication, and profile management
- Public doctor directory with search, filters, sorting, and pagination
- Doctor profiles with ratings, reviews, availability, and working hours
- Appointment booking for **clinic** (in-person) and **video** consultations
- Appointment rescheduling and cancellation
- Online payment via **Stripe Checkout** with a **demo-mode** fallback
- Clinic (cash/card on visit) payment tracking
- Payment history and downloadable PDF receipts
- Medical records (EMR): diagnosis, treatment plan, structured prescriptions,
  prescription PDFs, uploaded reports, and follow-up notes
- **Video consultations** powered by **Jitsi Meet**
- **AI Assistant**: symptom checker, FAQ answers, health tips, and doctor
  recommendations (local rules engine — no external LLM required)
- Doctor portal: dashboard, availability/schedule management, appointment
  management, EMR management, payment history/reports, video consultations
- Admin portal: dashboard, analytics and reporting (with PDF/Excel/CSV export),
  doctor CRUD with image upload, patient management, appointment and payment
  management, refunds, payment reports, and settings
- Security hardening: authentication, authorization, rate limiting, request
  logging, CORS allowlisting, upload validation, and input validation

### 1.2.2 Out-of-Scope (Future Considerations)

- Native mobile applications (iOS/Android)
- Real-time chat between patient and doctor outside consultations
- Electronic health record (EHR) interoperability standards (HL7/FHIR)
- Multiple languages/localization (initial release is English)
- Insurance and billing integration
- SMS notifications (email + in-app toasts only in v1)
- Availability of email notifications is optional based on SMTP configuration

## 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|-----------|
| **Patient / User** | A registered end-user who books and manages appointments. |
| **Doctor** | A healthcare professional who provides consultations and manages schedules and medical records. |
| **Admin** | A platform administrator who manages doctors, patients, appointments, payments, and analytics. |
| **Appointment** | A scheduled interaction between a patient and a doctor, either in-clinic or via video. |
| **EMR** | Electronic Medical Record — the digital clinical record of a patient. |
| **Consultation Fee** | The fee charged for one appointment; captured at booking time. |
| **Slot** | A discrete time interval offered by a doctor on an available day (e.g., `09:00 AM`). |
| **Stripe Checkout** | The hosted payment page provided by the Stripe payment gateway. |
| **Webhook** | An HTTP callback sent by Stripe to the backend on payment events. |
| **JWT** | JSON Web Token — used for session authentication and Jitsi room tokens. |
| **RBAC** | Role-Based Access Control — restricts access per role (user/doctor/admin). |
| **API** | Application Programming Interface. |
| **REST** | Representational State Transfer — the API architectural style used. |
| **CORS** | Cross-Origin Resource Sharing. |
| **CSP** | Content Security Policy. |
| **SLA** | Service Level Agreement. |
| **NFR** | Non-Functional Requirement. |
| **MoSCoW** | Prioritization scheme: **Must**, **Should**, **Could**, **Won't**. |
| **SRS** | Software Requirements Specification. |
| **PDF/XLSX/CSV** | Portable Document Format / Excel Workbook / Comma-Separated Values. |
| **FQDN** | Fully Qualified Domain Name. |
| **`Rs.`** | Rupees — the currency symbol used across the UI (default Stripe currency `PKR`). |

## 1.4 References

| Reference | Description |
|-----------|-------------|
| `README.md` | Project overview, setup, environment variables, and API reference |
| `backend/.env.example` | Documented environment variables |
| `backend/` | Express + Mongoose API source |
| `frontend/` | Patient web application source |
| `admin/` | Admin + Doctor portal source |
| Express.js / Mongoose / React 18 / Vite / Stripe / Jitsi Meet documentation | Underlying technology references |

## 1.5 Document Conventions

- Requirement identifiers use the pattern **FR-`<AREA>`-`<NNN>`** (e.g., `FR-AUTH-001`).
- Non-functional requirements use **NFR-`<AREA>`-`<NNN>`**.
- Every requirement is assigned a MoSCoW priority:
  - **Must** — essential; system cannot be released without it.
  - **Should** — important but with a documented workaround.
  - **Could** — desirable; implemented only if time and budget permit.
  - **Won't** — explicitly excluded from this release.

---

# 2. Overall Description

## 2.1 Product Perspective

DocBook is a new, self-contained product. It is composed of three deployable
components that communicate over HTTP/HTTPS:

```
                    ┌─────────────────────────────────────────────┐
                    │                 DocBook                     │
                    └─────────────────────────────────────────────┘
   ┌───────────────────────┐   ┌──────────────────────────────────────────┐
   │   Patient Portal       │   │   Admin & Doctor Portal                   │
   │   (frontend/)          │   │   (admin/)                                │
   │   React 18 + Vite      │   │   React 18 + Vite + Recharts              │
   │   http://localhost:5173│   │   http://localhost:5174                   │
   └───────────┬───────────┘   └───────────────┬──────────────────────────┘
               │        HTTPS / JSON REST API  │
               └───────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │     Backend REST API         │
                │     (backend/)               │
                │     Node.js + Express        │
                │     http://localhost:5000    │
                └───────┬──────────────┬───────┘
                        │              │
        ┌───────────────┼───────┐      ├──────────────┐
        ▼               ▼       ▼      ▼              ▼
   ┌──────────┐  ┌───────────┐ ┌──────────────┐ ┌──────────┐
   │ MongoDB  │  │ Stripe    │ │ Jitsi Meet   │ │ SMTP     │
   │ (primary │  │ Checkout  │ │ (external    │ │ (email / │
   │ datastore)│  │ + webhook │ │ video API)   │ │ console) │
   └──────────┘  └───────────┘ └──────────────┘ └──────────┘
```

The product also stores uploaded files on the local filesystem:

- `backend/uploads/` — doctor profile images (served as static, cached files)
- `backend/medical-files/` — EMR reports and prescription PDFs (served **only**
  through authenticated download endpoints; never as static files)

## 2.2 Product Functions

**High-level function list by actor:**

- **Any visitor (unauthenticated)**
  - Browse the doctor directory; search and filter doctors
  - View doctor profiles, ratings, and reviews
  - View specializations and public statistics
  - Use the AI Assistant symptom checker and FAQ
  - Register and log in

- **Patient**
  - All visitor functions
  - Manage profile and change password
  - Book clinic or video appointments and select date/time slots
  - Pay online (Stripe/demo) or choose pay-at-clinic
  - View, reschedule, and cancel own appointments
  - View payment history and download PDF receipts
  - View and download own medical records, prescriptions, and reports
  - Write and delete reviews for doctors
  - Join video consultations for eligible appointments
  - Use the AI Assistant for chat, health tips, and doctor recommendations

- **Doctor**
  - Log in (separate doctor credential store)
  - View personal dashboard statistics
  - Manage availability: days, slots, working hours, breaks, blocked dates
  - Update profile (including profile photo)
  - Manage appointments: view, change status, add notes, mark clinic payment
  - Manage EMR: create/update records, prescriptions, reports, follow-up notes
  - View payment history and payment reports
  - Join video consultations for own appointments

- **Admin**
  - Log in (separate admin credential store)
  - View dashboard KPIs and comprehensive analytics with exports
  - Manage doctors (create, edit, view, activate/deactivate, delete, image upload)
  - Manage patients (activate/deactivate)
  - Manage appointments (view, change status, delete)
  - Manage payments (view, refund, edit clinic amounts, reports)
  - View any EMR record

## 2.3 User Classes and Characteristics

| Class | Characteristics |
|-------|-----------------|
| **Guest / Visitor** | No account. Access only public content. Low technical skill assumed. |
| **Patient** | Registered account. Books and manages appointments and records. Varying technical proficiency. |
| **Doctor** | Professional staff. Daily use of availability, appointments, EMR, and payments modules. |
| **Admin** | Platform operator. Periodic use of management and analytics modules. |
| **System** | Automated actor: Stripe webhook, background analytics aggregation, email dispatch. |

**Usage assumptions:** typical users access via modern evergreen browsers (Chrome,
Firefox, Edge, Safari) on desktop and mobile. The patient portal is responsive
down to ~360px viewport width.

## 2.4 Operating Environment

| Environment | Requirement |
|-------------|-------------|
| **Runtime** | Node.js 18+ (tested on 24.x); ES modules (`"type": "module"`) |
| **Database** | MongoDB (local 8.x or managed/Atlas) |
| **Patient frontend** | React 18 + Vite; static build output; served over HTTPS in production |
| **Admin/Doctor frontend** | React 18 + Vite + Recharts; static build output; served over HTTPS |
| **Payment gateway** | Stripe Checkout (test/live) with optional demo mode |
| **Video** | Jitsi Meet external API (`https://meet.jit.si/external_api.js`) |
| **Email** | Nodemailer SMTP (optional; console fallback) |
| **Reverse proxy** | Optional Nginx/Caddy in front of the API (TLS termination; `trust proxy` enabled in production) |

## 2.5 Design and Implementation Constraints

- **C-001 (Must):** All three components share a common backend; frontends are
  separate SPA builds and must not access MongoDB directly.
- **C-002 (Must):** Backend is a REST API returning a consistent envelope:
  `{ success, message, data }` for success and `{ success: false, message, stack? }`
  for errors (stack omitted in production).
- **C-003 (Must):** Authentication uses JWT stored in **httpOnly cookies**; passwords
  are hashed with **bcrypt**.
- **C-004 (Must):** Role-based access control (RBAC) must enforce
  user / doctor / admin permissions on every protected endpoint.
- **C-005 (Must):** Patient-facing and admin-facing applications are single-page
  apps built with Vite; every route is code-split (lazy-loaded) for performance.
- **C-006 (Must):** All date values are stored as `YYYY-MM-DD` strings; time slots
  as display strings (e.g., `09:00 AM`); timestamps use ISO dates (MongoDB `Date`).
- **C-007 (Must):** Currency is fixed per environment (`STRIPE_CURRENCY`, default
  `PKR`); amounts are displayed with `Rs.` in the UI.
- **C-008 (Should):** No external AI/LLM dependency — the AI Assistant must operate
  as a fully local rules engine.
- **C-009 (Must):** Doctor profile images must be auto-optimized (Sharp → WebP,
  max 600 px) before storage.

## 2.6 Assumptions and Dependencies

- MongoDB is available at the configured connection URI; the backend aborts startup
  in production if required environment variables are missing.
- Stripe keys are optional: with an empty `STRIPE_SECRET_KEY` the system runs in
  **demo mode** (payments auto-confirmed) to support local development.
- Jitsi Meet public infrastructure is reachable; no self-hosted Jitsi is required.
- SMTP is optional; without configuration, emails are logged to the console.
- A network/email infrastructure cannot be guaranteed; the system degrades
  gracefully (demo mode, console logging) so that core booking flows remain usable.
- Sample data is generated by a one-shot seed script against a fresh database only.

---

# 3. External Interface Requirements

## 3.1 User Interfaces

### 3.1.1 Patient Portal (`frontend/`)

| Requirement ID | Requirement | Priority |
|----------------|-------------|----------|
| **FR-UI-001** | The patient portal must provide the following routes: Home, All Doctors, Doctor Profile, Book Appointment, My Appointments, Payments (history + receipt), Medical Records (list + detail), AI Assistant, Video Consultation, Login, Register, User Profile, About, Payment Success, Payment Failure. | Must |
| **FR-UI-002** | The application must render a persistent navigation bar (desktop) and a slide-in drawer (mobile ≤768 px) with the links above. | Must |
| **FR-UI-003** | Every page must render a lazy-loading fallback (spinner) while its chunk loads, and an error boundary with a **Retry** action on unexpected render errors. | Must |
| **FR-UI-004** | Loading, empty, and error states must be provided for every data-driven page (spinners, empty-state messages with icons, error banners with retry). | Must |
| **FR-UI-005** | Destructive or consequential actions (payment confirmation, cancellations) must be confirmed via a modal or explicit confirmation step before execution. | Must |
| **FR-UI-006** | All forms (login, register, booking, profile) must show inline field validation, error messages, and disabled/spinner button states while submitting. | Must |
| **FR-UI-007** | The booking page must show a step progress indicator (Date → Time → Details → Confirm) and a live-updating sticky summary on desktop (stacked on mobile). | Should |
| **FR-UI-008** | Keyboard focus must be visible on all interactive controls (`:focus-visible` outlines). | Must |
| **FR-UI-009** | The UI must be fully responsive (mobile-first) with a consistent brand color scheme (#0077b6 primary / #0ea5e9 accent) and readable text hierarchy. | Must |

### 3.1.2 Admin + Doctor Portal (`admin/`)

| Requirement ID | Requirement | Priority |
|----------------|-------------|----------|
| **FR-UI-010** | The portal must provide a role-aware sidebar navigation for admin and doctor sections. | Must |
| **FR-UI-011** | Admin pages: Dashboard, Analytics, Doctors (list/add/edit/details), Patients, Appointments, Payments, Payment Reports, Settings, EMR, Video Consultations. | Must |
| **FR-UI-012** | Doctor pages: Dashboard, Availability/Schedule, Appointments, EMR, Payments, Payment Report, Profile, Change Password, Video Consultations. | Must |
| **FR-UI-013** | All pages must be lazy-loaded with error boundaries and shared reusable UI primitives (status badges, loading states, empty states, error banners, page headers). | Must |
| **FR-UI-014** | The Analytics page must render interactive charts (Recharts) for trends, revenue, and performance, with a period selector and export buttons (PDF / Excel / CSV). | Must |
| **FR-UI-015** | Data tables/lists must support pagination and clear status indicators. | Should |

## 3.2 Software Interfaces

| Interface | Protocol | Purpose |
|-----------|----------|---------|
| **MongoDB** | TCP (Mongoose ODM) | Primary data store for all entities. |
| **Stripe Checkout** | HTTPS REST | Create checkout sessions; receive payment events via webhook. |
| **Stripe Webhook** | HTTPS POST (raw body + signature) | Confirm `checkout.session.completed`, refunds, payment intents. |
| **Jitsi Meet API** | HTTPS + WebSocket (browser) | Video conferencing rooms; token-based authentication via signed JWT. |
| **SMTP** | SMTP/SMTPS | Transactional email (booking/receipt notifications). |
| **File system** | Local disk | Doctor images (`uploads/`), EMR files (`medical-files/`). |
| **Browser storage** | Cookie | Auth token (httpOnly), CSRF-safe session management. |

## 3.3 Hardware Interfaces

- No specialized hardware is required. The product runs on commodity servers and
  standard user devices (desktop/laptop/tablet/phone with a camera and microphone
  for video consultations).

## 3.4 Communication Interfaces

- **HTTP/HTTPS REST** with JSON bodies (`Content-Type: application/json`).
- The Stripe webhook endpoint must receive a **raw body** for signature verification
  (registered before the JSON body parser).
- Multipart/form-data for image and report uploads.
- Static asset caching: `/uploads` served with `Cache-Control: public, max-age=604800, immutable` and compression enabled.
- CORS restricted to allowlisted origins (`CORS_ORIGINS` + default dev ports).

---

# 4. Functional Requirements

## 4.1 Requirement Format

Each functional requirement is identified by a unique code and carries a MoSCoW
priority. Requirements are grouped by feature area. Where a requirement depends on
another, the dependency is noted in the text.

## 4.2 Authentication and Account Management

### 4.2.1 Registration

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-AUTH-001** | The system must allow a visitor to register a patient account with name, email, password, and password confirmation. | Must |
| **FR-AUTH-002** | Email must be unique (case-insensitive), and passwords must be at least **6 characters**. | Must |
| **FR-AUTH-003** | The registration endpoint must be rate-limited to prevent abuse. | Must |
| **FR-AUTH-004** | The password must be hashed with **bcrypt** before storage; plaintext passwords must never be stored or logged. | Must |
| **FR-AUTH-005** | Successful registration must create the account, sign the user in (issue a cookie), and redirect the patient to their appointments area. | Must |

### 4.2.2 Login / Logout

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-AUTH-006** | A registered patient must be able to log in with email and password. | Must |
| **FR-AUTH-007** | Login must be rate-limited (default 10 attempts/min, success responses not counted). | Must |
| **FR-AUTH-008** | On success the system must issue a JWT stored in an httpOnly cookie and return the user profile. | Must |
| **FR-AUTH-009** | On failure the system must return a generic error and record the attempt (for rate limiting); it must not reveal whether the email exists. | Must |
| **FR-AUTH-010** | Logout must invalidate/clear the auth cookie. | Must |
| **FR-AUTH-011** | The login form must validate email format and required fields client-side before submission. | Must |

### 4.2.3 Profile and Password

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-AUTH-012** | A patient must be able to view and update profile fields: name, image, phone, date of birth, gender (Male/Female/Other), and address. | Must |
| **FR-AUTH-013** | A patient must be able to change their password after verifying the current password; the new password must meet the minimum-length rule. | Must |
| **FR-AUTH-014** | A `/me` endpoint must return the current authenticated user's profile. | Must |
| **FR-AUTH-015** | Doctors and admins must log in through dedicated endpoints that enforce their role (doctor/admin), keeping patient credentials separate. | Must |
| **FR-AUTH-016** | Each portal must protect its routes; unauthenticated access must redirect to the appropriate login page, and authenticated users must not access another role's portal. | Must |

## 4.3 Patient: Doctor Directory and Discovery

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-DOC-001** | The system must provide a public, paginated list of doctors who are `isAvailable`. | Must |
| **FR-DOC-002** | The list must support searching by doctor name or specialization (case-insensitive substring). | Must |
| **FR-DOC-003** | The list must support filtering by specialization, maximum fee, minimum experience, and a specific availability day. | Must |
| **FR-DOC-004** | The list must support sorting by name (A–Z / Z–A), experience, fee, and rating. | Must |
| **FR-DOC-005** | The search URL must be shareable: all filters/sort/page state must be encoded in URL query parameters. | Must |
| **FR-DOC-006** | The system must return result counts and pagination metadata (total, page, pages). | Must |
| **FR-DOC-007** | The Doctors page must show removable "active filter" chips and a clear-all action for immediate feedback. | Should |
| **FR-DOC-008** | The system must expose the list of distinct specializations for filter dropdowns. | Must |
| **FR-DOC-009** | The system must expose public statistics: total doctors, total specializations, total patients, total appointments. | Must |
| **FR-DOC-010** | The Home page must show a "featured doctors" section (top-rated, limited count) and specialization quick links. | Must |
| **FR-DOC-011** | Doctor cards must display name, specialization, rating, review count, experience, location, fee, and an availability status (Online / Available Today / Unavailable) and a clear "Book Appointment" call to action. | Should |

## 4.4 Patient: Doctor Profile and Reviews

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-REV-001** | A public doctor profile page must display photo, name, specialization, rating, review count, experience, education, location/hospital, about, languages, working hours, availability days/slots, and consultation fee. | Must |
| **FR-REV-002** | Visitors must be able to view all published reviews for a doctor (paginated), sorted newest first. | Must |
| **FR-REV-003** | A logged-in patient must be able to submit a review for a doctor with a rating (1–5) and an optional comment (max 1000 characters). | Must |
| **FR-REV-004** | A patient may submit at most **one** review per doctor (enforced by a unique constraint on doctor + user). | Must |
| **FR-REV-005** | A patient must be able to see their own review for a doctor and edit-aware state; they may delete their review. | Must |
| **FR-REV-006** | Deleting a review must recompute the doctor's aggregate rating and review count. | Must |
| **FR-REV-007** | The system should allow a review to be linked to a completed appointment for authenticity. | Could |

## 4.5 Patient: Appointment Booking

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-BOOK-001** | A logged-in patient must be able to start booking for a selected doctor. | Must |
| **FR-BOOK-002** | The booking flow must display the next 14 calendar days; days outside the doctor's `availableDays` must be shown as disabled/not selectable. | Must |
| **FR-BOOK-003** | After selecting a date, the patient must select a time slot from the doctor's `availableSlots`. | Must |
| **FR-BOOK-004** | The patient must choose a consultation type: **In Clinic** or **Video Call**. | Must |
| **FR-BOOK-005** | The patient must choose a payment method: **Pay Online** (Stripe/demo) or **Pay at Clinic**. | Must |
| **FR-BOOK-006** | The patient may add optional notes for the doctor. | Must |
| **FR-BOOK-007** | The system must display a live booking summary (doctor, date, time, consultation type, payment method, fee) before confirmation, sticky on desktop. | Should |
| **FR-BOOK-008** | On submit, the backend must validate: doctor availability, date falls on an available day, slot is in the doctor's slot list, and the slot is not already booked for that doctor/date. | Must |
| **FR-BOOK-009** | A unique database index on `{ doctorId, date, timeSlot }` must prevent double-booking at the database level. | Must |
| **FR-BOOK-010** | The appointment must record the consultation fee at booking time (snapshot of the doctor's current fee). | Must |
| **FR-BOOK-011** | New appointments must be created with status `pending` and payment status `pending`. | Must |
| **FR-BOOK-012** | For **Pay at Clinic**, the appointment must be confirmed directly and the user notified. | Must |
| **FR-BOOK-013** | For **Pay Online**, the system must create the appointment and then initiate a Stripe Checkout session for the consultation fee. | Must |
| **FR-BOOK-014** | The confirm button must show a busy/spinner state during submission and be disabled until a date and slot are selected. | Must |
| **FR-BOOK-015** | After successful booking, the system must display a confirmation screen with doctor, date, time, fee, and actions (View My Appointments / Browse More Doctors). | Must |

## 4.6 Patient: Rescheduling and Cancellation

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-RES-001** | A patient must be able to view their own appointments (paginated) with date, time, doctor, status, payment status, and meeting type. | Must |
| **FR-RES-002** | A patient must be able to open an appointment detail view. | Must |
| **FR-RES-003** | A patient must be able to **reschedule** an eligible appointment to a new date/time, subject to the same validation as booking (available day, valid slot, no conflict). | Must |
| **FR-RES-004** | Rescheduling must be blocked for appointments that are cancelled, completed, or rejected. | Must |
| **FR-RES-005** | A patient must be able to **cancel** an eligible appointment with an optional reason. | Must |
| **FR-RES-006** | The UI must display clear success/error toasts and update lists immediately after reschedule/cancel actions. | Must |
| **FR-RES-007** | The UI should surface a "free cancellation/rescheduling up to 24h before" policy as helpful context. | Could |

## 4.7 Payments

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-PAY-001** | The system must create a Stripe Checkout session for an online-payment appointment, storing the session ID and provider details on a Payment record. | Must |
| **FR-PAY-002** | Payment records must carry a **unique receipt number**. | Must |
| **FR-PAY-003** | The Stripe webhook endpoint must verify the signature and, on `checkout.session.completed`, mark the payment paid, set the appointment payment status to `paid`, and confirm the appointment. | Must |
| **FR-PAY-004** | In **demo mode** (no Stripe key configured), the system must simulate the checkout completing and confirm the payment immediately with provider `demo`. | Must |
| **FR-PAY-005** | The system must support payment statuses: `pending`, `paid`, `refunded`, `free`, `failed`. | Must |
| **FR-PAY-006** | The system must support payment providers: `stripe`, `demo`, `clinic`. | Must |
| **FR-PAY-007** | A patient must be able to view their payment history with amount, doctor, date, status, and receipt. | Must |
| **FR-PAY-008** | A patient must be able to download a **PDF receipt** for a paid payment. | Must |
| **FR-PAY-009** | The system must show a payment success screen after completed checkout and a failure screen on abandonment/failure. | Must |
| **FR-PAY-010** | An admin must be able to **refund** a paid payment (with optional reason), recording refund status and updating the appointment. | Must |
| **FR-PAY-011** | A doctor must be able to mark an appointment's **pay-at-clinic** payment as paid from the appointment details, creating a clinic payment record. | Must |
| **FR-PAY-012** | Admins must be able to edit clinic payment amounts; edits must be audited (previous amount, timestamp, actor, reason). | Must |
| **FR-PAY-013** | The system must generate payment reports (list + aggregate) for doctors and admins. | Must |

## 4.8 Patient: Medical Records (EMR)

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-EMR-001** | A doctor must be able to create an EMR record for a patient linked to a doctor and (optionally) an appointment, including visit date, diagnosis, and treatment plan. | Must |
| **FR-EMR-002** | A doctor must be able to add structured prescriptions: medicine, dosage, frequency, duration, and instructions. | Must |
| **FR-EMR-003** | A doctor must be able to upload a **prescription PDF** for a record (single file). | Must |
| **FR-EMR-004** | A doctor must be able to upload **reports** for a record (up to 5), each with a filename, type, and size; oversize/non-allowed files must be rejected (15 MB limit). | Must |
| **FR-EMR-005** | A doctor must be able to add **follow-up notes** to a record (timestamped). | Must |
| **FR-EMR-006** | A doctor must be able to update and delete their EMR records. | Must |
| **FR-EMR-007** | A patient must be able to view a list of their own medical records and open a detailed view. | Must |
| **FR-EMR-008** | A patient must be able to **download** their prescription PDFs and reports through authenticated endpoints. | Must |
| **FR-EMR-009** | EMR files must be stored outside the static uploads directory and served **only** via authenticated, role-checked download endpoints. | Must |
| **FR-EMR-010** | Admins must be able to view any patient's medical records. | Must |
| **FR-EMR-011** | A doctor must be able to list their patients (patients with at least one record or appointment). | Must |

## 4.9 Video Consultations

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-MEET-001** | Appointments with `meetingType: video` must have a meeting room and provider (`jitsi`). | Must |
| **FR-MEET-002** | The backend must generate a **signed JWT** for each meeting room and return it along with the room URL so that only the patient and the assigned doctor can join. | Must |
| **FR-MEET-003** | The backend must expose a meeting-details endpoint for an appointment restricted to the appointment's patient or assigned doctor. | Must |
| **FR-MEET-004** | The patient portal must render a video consultation page using the Jitsi external API with the provided room and token. | Must |
| **FR-MEET-005** | The doctor portal must render the equivalent video consultation page for the doctor. | Must |
| **FR-MEET-006** | The system must record meeting history: role (patient/doctor), joinedAt, leftAt, and duration, posted by the client on join/leave. | Must |
| **FR-MEET-007** | The backend must include the Jitsi script source in the app's CSP/script allowlist or otherwise handle cross-origin loading explicitly. | Must |

## 4.10 AI Assistant

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-AI-001** | The system must provide a symptom checker: a patient enters symptoms and receives a body-system mapping, severity assessment, and triage advice. | Must |
| **FR-AI-002** | The system must provide a chat assistant that answers FAQs about booking, payments, rescheduling, and general health using intent detection and token-scored FAQ matching. | Must |
| **FR-AI-003** | The assistant must detect mentions of medical specialties and recommend matching doctors from the live directory before falling back to FAQ answers. | Should |
| **FR-AI-004** | The assistant must provide rotating daily health tips. | Should |
| **FR-AI-005** | All assistant endpoints must be rate-limited (default 30/min). | Must |
| **FR-AI-006** | The assistant must run as a **local rules engine** with no external LLM dependency. | Must |
| **FR-AI-007** | The assistant must include clear disclaimers that it is not a substitute for professional medical advice. | Must |
| **FR-AI-008** | A widget/chat entry point must be available on patient-facing pages. | Should |

## 4.11 Doctor Portal

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-DOCP-001** | The doctor must see a dashboard with key statistics (appointments, revenue, completion/cancellation, etc.). | Must |
| **FR-DOCP-002** | The doctor must be able to view and update their availability: available days, time slots, working hours, break timings, and blocked dates. | Must |
| **FR-DOCP-003** | The doctor must be able to update their public profile, including name, specialization, education, experience, fees, location, hospital, about, languages, and profile photo (uploaded image auto-optimized). | Must |
| **FR-DOCP-004** | The doctor must be able to toggle their availability (`isAvailable`) and online-consultation status (`isOnline`). | Must |
| **FR-DOCP-005** | The doctor must be able to view their appointments (by date/status), open details, change appointment status (`confirmed`/`completed`/`cancelled`/`rejected`), add doctor notes, and mark clinic payments as paid. | Must |
| **FR-DOCP-006** | The doctor must be able to view their payment history and a payment report. | Must |
| **FR-DOCP-007** | The doctor must be able to change their password. | Must |
| **FR-DOCP-008** | Doctor actions must be protected by the doctor role; a doctor must not be able to modify another doctor's data. | Must |

## 4.12 Admin Portal and Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-ADM-001** | The admin must see a dashboard with KPIs (totals, earnings, completion/cancellation rates, etc.). | Must |
| **FR-ADM-002** | The admin must be able to create a doctor (name, email, password, specialization, experience, fees, availability, image, etc.). | Must |
| **FR-ADM-003** | The admin must be able to edit, view, activate/deactivate, and delete doctors. | Must |
| **FR-ADM-004** | Doctor profile images uploaded by admins must be optimized (Sharp → WebP, ≤600 px). | Must |
| **FR-ADM-005** | The admin must be able to manage patients: view list, view details, and activate/deactivate accounts. | Must |
| **FR-ADM-006** | The admin must be able to view and manage all appointments (change status, delete). | Must |
| **FR-ADM-007** | The admin must be able to view all payments, view details, refund payments, edit clinic amounts (audited), and view payment reports. | Must |
| **FR-ADM-008** | The admin must be able to view any EMR record. | Must |
| **FR-ADM-009** | The admin must be able to update their own profile and password. | Must |

### Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-ANA-001** | The analytics endpoint must return data for a selectable period: `7d`, `30d`, `3m`, `6m`, `12m`, or `all` (default `30d`). | Must |
| **FR-ANA-002** | Analytics must include overall stats (totals, earnings, completion and cancellation rates, video vs clinic share, online vs clinic payment share, peak hour/day). | Must |
| **FR-ANA-003** | Analytics must include trend series (daily, weekly, monthly) of appointments and revenue. | Must |
| **FR-ANA-004** | Analytics must include distributions: appointment status, revenue by status/type/method, and revenue by specialization and by doctor. | Must |
| **FR-ANA-005** | Analytics must include patient growth, doctor performance, most-booked doctors, and top specializations. | Must |
| **FR-ANA-006** | Analytics must include peak-hours and day-of-week distributions, plus a generated-at timestamp. | Must |
| **FR-ANA-007** | The admin must be able to **export** analytics as **PDF**, **Excel (XLSX)**, or **CSV** for the selected period. | Must |
| **FR-ANA-008** | The CSV export must include a UTF-8 BOM; the Excel export must contain multiple styled sheets; the PDF export must be paginated. | Must |

## 4.13 Notifications and Email

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-NOT-001** | The system must provide immediate in-app feedback via toast notifications for all user actions (booking, reschedule, cancel, payment, profile update). | Must |
| **FR-NOT-002** | When SMTP is configured, the system must send transactional emails for key events (e.g., appointment booking confirmation, payment receipt). | Should |
| **FR-NOT-003** | When SMTP is not configured, email output must be logged to the console (no failure). | Must |
| **FR-NOT-004** | Email templates must include appointment details (doctor, date, time, fee) in a readable layout. | Should |

## 4.14 Cross-Cutting Platform Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-SEC-001** | All API responses must use the standard success/error envelope. | Must |
| **FR-SEC-002** | Every protected route must enforce authentication and role authorization. | Must |
| **FR-SEC-003** | The API must apply rate limits: global (default 300 req/60 s), auth (default 10 req/min), assistant (default 30 req/min). | Must |
| **FR-SEC-004** | The API must apply security headers via Helmet (CSP intentionally disabled due to Jitsi cross-origin script; all other defaults retained). | Must |
| **FR-SEC-005** | CORS must only allow configured origins. | Must |
| **FR-SEC-006** | Each request must be assigned a **request ID**, logged in access logs and error logs for traceability. | Must |
| **FR-SEC-007** | Structured logging must distinguish levels (debug/info/warn/error) with JSON output in production. | Must |
| **FR-SEC-008** | The server must support graceful shutdown on SIGTERM/SIGINT with a forced-exit timeout. | Must |
| **FR-SEC-009** | In production, the server must abort startup when required configuration (e.g., `MONGODB_URI`, `JWT_SECRET`) is missing. | Must |
| **FR-SEC-010** | Upload validation: image size limit 5 MB and image extensions only (jpeg/jpg/png/webp); report size limit 15 MB with extension filtering. | Must |
| **FR-SEC-011** | File uploads must be scanned/filtered by extension and size; doctor images must be re-encoded to WebP, which also neutralizes embedded payloads. | Must |
| **FR-SEC-012** | The health check endpoint must report API status without sensitive information. | Must |
| **FR-SEC-013** | Database indexes must exist for all hot query paths; automatic index creation must be disabled in production. | Must |
| **FR-SEC-014** | Both frontends must lazy-load routes and split vendor chunks for performance. | Must |

---

# 5. Non-Functional Requirements

## 5.1 Performance

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-PERF-001** | Read-only API endpoints (doctor list, doctor detail, specializations) should respond within **500 ms** (p95) under normal load. | Should |
| **NFR-PERF-002** | The application must support pagination on all list endpoints to bound response sizes and database load. | Must |
| **NFR-PERF-003** | Static assets (images, JS/CSS bundles) must be cacheable; `/uploads` must be served with immutable cache headers. | Must |
| **NFR-PERF-004** | Doctor profile images must be optimized (≤600 px, WebP) at upload time to reduce bandwidth. | Must |
| **NFR-PERF-005** | The frontend initial bundle must be code-split so each page loads only its own chunk plus shared vendor chunks. | Must |
| **NFR-PERF-006** | Analytics aggregation queries should complete within a few seconds for the default period; heavy periods (`all`) are expected to take longer but must still complete. | Should |
| **NFR-PERF-007** | API responses must be gzip-compressed via Express compression. | Must |

## 5.2 Security

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-SEC-001** | Passwords must be hashed with bcrypt (never stored or transmitted in plaintext). | Must |
| **NFR-SEC-002** | Auth tokens must be stored in httpOnly cookies to mitigate XSS token theft. | Must |
| **NFR-SEC-003** | All production traffic must use HTTPS/TLS (via deployment/reverse proxy). | Must |
| **NFR-SEC-004** | The API must enforce rate limiting on auth and abuse-prone endpoints. | Must |
| **NFR-SEC-005** | CORS must be restricted to an explicit allowlist. | Must |
| **NFR-SEC-006** | Sensitive values (JWT secret, database URI, Stripe keys, SMTP credentials) must never be committed to source control; they must come from environment variables. | Must |
| **NFR-SEC-007** | Error responses must not leak stack traces in production. | Must |
| **NFR-SEC-008** | Authorization checks must verify ownership (e.g., a patient may only access their own records/appointments/payments; a doctor only their own schedule/patients). | Must |
| **NFR-SEC-009** | The Stripe webhook endpoint must verify the webhook signature against the configured secret. | Must |
| **NFR-SEC-010** | EMR files must not be served from a public static path; downloads must require authentication and authorization. | Must |

## 5.3 Reliability and Availability

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-REL-001** | The backend must handle database connection failures with bounded server-selection timeouts and reconnect with logging. | Must |
| **NFR-REL-002** | The server must shut down gracefully on termination signals, allowing in-flight requests to complete. | Must |
| **NFR-REL-003** | Unhandled promise rejections and uncaught exceptions must be handled to avoid silent crashes (process exits and logs). | Must |
| **NFR-REL-004** | The payment flow must be resilient: if payment cannot be initiated after booking, the appointment remains and the patient can pay later from My Appointments. | Must |
| **NFR-REL-005** | The system should tolerate SMTP unavailability (console fallback) without breaking core flows. | Must |
| **NFR-REL-006** | The patient and admin frontends must display error boundaries with retry instead of blank screens on runtime errors. | Must |

## 5.4 Usability

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-USR-001** | The patient portal must be usable on screens from 360 px wide upward (responsive layout). | Must |
| **NFR-USR-002** | All interactive elements must have visible focus states. | Must |
| **NFR-USR-003** | The booking flow must provide clear progress indication and live summary feedback. | Should |
| **NFR-USR-004** | Forms must provide immediate, inline validation messages and disabled/spinner states while submitting. | Must |
| **NFR-USR-005** | Destructive actions must require confirmation to prevent accidental data loss. | Must |
| **NFR-USR-006** | Loading, empty, and error states must be provided on all data-driven pages. | Must |
| **NFR-USR-007** | The design must maintain a consistent visual language (colors, typography, spacing, component styles) across both portals. | Should |
| **NFR-USR-008** | Content copy (buttons, labels, errors) must be concise and plain-language. | Should |

## 5.5 Maintainability

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-MNT-001** | The backend must be organized by separation of concerns: routes, controllers, middleware, models, services, utils, config. | Must |
| **NFR-MNT-002** | Shared configuration must be centralized and validated in a single config module. | Must |
| **NFR-MNT-003** | Frontends must reuse shared components (cards, loading, empty state, error, buttons, status badges) instead of duplicating markup. | Should |
| **NFR-MNT-004** | Environment configuration must be documented in `.env.example`. | Must |
| **NFR-MNT-005** | Logging must be structured and request-scoped to aid debugging. | Must |

## 5.6 Portability and Deployment

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-PORT-001** | The backend must run on any platform that supports Node.js 18+ and MongoDB. | Must |
| **NFR-PORT-002** | The frontends must produce static builds (Vite `dist/`) deployable to any static host (Vercel, Netlify, etc.). | Must |
| **NFR-PORT-003** | The API base URL must be configurable in each frontend's axios client. | Must |
| **NFR-PORT-004** | Deployment must support a reverse proxy in front of the backend with `trust proxy` enabled for accurate rate limiting. | Should |
| **NFR-PORT-005** | Production and development configurations must differ only via environment variables (e.g., secure cookies, JSON logging, strict env validation, `autoIndex` off). | Must |

## 5.7 Compliance, Legal, and Privacy

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-COMP-001** | The system must treat medical records and personal data as confidential and restrict access via authentication and role/ownership checks. | Must |
| **NFR-COMP-002** | The AI Assistant must include a medical disclaimer that its output is informational and not a substitute for professional advice. | Must |
| **NFR-COMP-003** | The system should avoid collecting unnecessary personal data; fields beyond core needs are optional. | Should |
| **NFR-COMP-004** | If deployed in regulated jurisdictions, the operator must ensure compliance with applicable data-protection and healthcare regulations (e.g., HIPAA/GDPR) — out of scope for the software itself. | Should |
| **NFR-COMP-005** | Financial transactions (refunds, amount edits) must be auditable with actor, timestamp, and reason. | Must |

---

# 6. Data Requirements

## 6.1 Logical Data Model

```
User (patient) 1 ──── * Appointment * ──── 1 Doctor
                     * Appointment 1 ──── 0..1 Payment
User 1 ──── * Review * ──── 1 Doctor
User 1 ──── * MedicalRecord * ──── 1 Doctor
                       MedicalRecord 0..1 ──── 0..1 Appointment
```

**Cardinality summary:**

- A **User** can have many appointments, payments, reviews, and medical records.
- A **Doctor** can have many appointments, payments, reviews, and medical records.
- An **Appointment** belongs to exactly one user and one doctor, and at most one payment.
- A **MedicalRecord** belongs to one user, one doctor, and optionally one appointment.
- A **Review** belongs to one user and one doctor; each (doctor, user) pair may have at most one review.

## 6.2 Entity Definitions

### User (`users` collection)

| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | required, unique, lowercase, trimmed |
| password | String | required, min 6, bcrypt-hashed |
| image | String | default `""` |
| phone | String | optional |
| dob | String | optional |
| gender | String | enum `""` / Male / Female / Other |
| address | String | optional |
| role | String | enum `user` / `admin`, default `user` |
| isActive | Boolean | default true |
| timestamps | Date | createdAt / updatedAt |
| Index | `{ role, createdAt }` | |

### Doctor (`doctors` collection)

| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | required, unique |
| password | String | required, min 6, bcrypt-hashed |
| image | String | optimized WebP path |
| phone / gender / dob | String | optional |
| specialization | String | required |
| education | String | optional |
| experience | Number | required, min 0 |
| fees | Number | required, min 0 |
| location / hospital / address / about | String | optional |
| languages | [String] | |
| availableDays | [String] | e.g., `Monday` |
| availableSlots | [String] | e.g., `09:00 AM` |
| workingHours | `{ start, end }` | default 09:00–17:00 |
| breakTimings | `[{ start, end }]` | |
| blockedDates | [String] | |
| appointmentDuration | Number | default 30, min 5 |
| rating | Number | 0–5 |
| reviews | Number | count |
| isAvailable | Boolean | default true |
| isOnline | Boolean | default false |
| Indexes | `{ specialization }`, `{ isAvailable, specialization }`, text index `{ name, specialization }` | |

### Appointment (`appointments` collection)

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId (ref User) | required |
| doctorId | ObjectId (ref Doctor) | required |
| date | String | `YYYY-MM-DD` |
| timeSlot | String | |
| status | String | enum `pending`/`confirmed`/`completed`/`cancelled`/`rejected`, default `pending` |
| consultationFee | Number | snapshot at booking |
| cancellationReason | String | |
| doctorNotes / patientNotes | String | |
| paymentStatus | String | enum `pending`/`paid`/`refunded`/`free`/`failed`, default `pending` |
| paymentMethod | String | enum `online`/`clinic`, default `clinic` |
| paymentId | ObjectId (ref Payment) | nullable |
| meetingType | String | enum `clinic`/`video`, default `clinic` |
| meetingProvider | String | enum `jitsi` |
| meetingRoom | String | |
| meetingHistory | [{ role, joinedAt, leftAt, duration }] | |
| Indexes | `{ doctorId, date, timeSlot }` (unique booking guard), `{ userId, createdAt }`, `{ userId, status, createdAt }`, `{ date }`, `{ status, date }` | |

### Payment (`payments` collection)

| Field | Type | Notes |
|-------|------|-------|
| receiptNumber | String | required, unique |
| userId / doctorId / appointmentId | ObjectId refs | required |
| amount | Number | min 0 |
| currency | String | default `PKR` |
| paymentMethod | String | `online`/`clinic` |
| provider | String | `stripe`/`demo`/`clinic` |
| providerPaymentId / checkoutSessionId / receiptUrl | String | |
| status | String | `pending`/`paid`/`failed`/`refunded` |
| paidAt | Date | |
| amountEdited | `{ previousAmount, editedAt, editedBy, reason }` | audit |
| refund | `{ refundId, amount, reason, status, refundedAt }` | |
| Indexes | `{ userId, createdAt }`, `{ doctorId, createdAt }`, `{ appointmentId }`, `{ checkoutSessionId }`, `{ status, createdAt }` | |

### Review (`reviews` collection)

| Field | Type | Notes |
|-------|------|-------|
| doctorId | ObjectId (ref Doctor) | required |
| userId | ObjectId (ref User) | required |
| appointmentId | ObjectId (ref Appointment) | nullable |
| rating | Number | required, 1–5 |
| comment | String | max 1000 |
| Indexes | unique `{ doctorId, userId }`, `{ doctorId, createdAt }` | |

### MedicalRecord (`medicalrecords` collection)

| Field | Type | Notes |
|-------|------|-------|
| userId / doctorId | ObjectId refs | required |
| appointmentId | ObjectId ref | nullable |
| visitDate | String | |
| diagnosis / treatmentPlan | String | |
| prescriptions | [ { medicine, dosage, frequency, duration, instructions } ] | |
| prescriptionPdf | `{ fileName, originalName, size }` | nullable |
| reports | [ { fileName, originalName, fileType, size, uploadedAt } ] | max 5 |
| followUpNotes | [ { text, createdAt } ] | |
| Indexes | `{ userId, createdAt }`, `{ doctorId, createdAt }`, `{ appointmentId }`, `{ doctorId, userId }` | |

## 6.3 Data Integrity Rules

- **D-001:** Email uniqueness for users and doctors is enforced by unique indexes.
- **D-002:** One review per (doctor, user) pair is enforced by a unique compound index.
- **D-003:** Double-booking is prevented by a unique index on `{ doctorId, date, timeSlot }` in addition to application-level validation.
- **D-004:** Payment `receiptNumber` is unique.
- **D-005:** All enum fields are validated against their allowed values at the schema level.
- **D-006:** Referenced documents (userId, doctorId, appointmentId) are validated at the application layer; orphaned references are possible only if admins delete entities, which must be handled transactionally where supported.

---

# 7. Business Rules

| ID | Business Rule |
|----|---------------|
| **BR-001** | Only doctors with `isAvailable = true` appear in the public directory and can receive bookings. |
| **BR-002** | Booking is only permitted for a date whose weekday is in the doctor's `availableDays` and a slot in the doctor's `availableSlots`, and when the slot is unbooked for that doctor/date. |
| **BR-003** | The consultation fee stored on an appointment is the doctor's fee at booking time; later fee changes do not affect existing appointments. |
| **BR-004** | Online-payment appointments remain `pending` until payment is confirmed (webhook or demo), then become `confirmed` with `paymentStatus: paid`. |
| **BR-005** | Pay-at-clinic appointments are confirmed at booking with `paymentStatus: pending`; the doctor marks them paid after the visit. |
| **BR-006** | Cancelled/completed/rejected appointments cannot be rescheduled. |
| **BR-007** | A doctor may change an appointment status among `confirmed`, `completed`, `cancelled`, `rejected`; relevant transitions are recorded. |
| **BR-008** | Refunding a paid payment must update the payment, refund record, and the associated appointment's payment status. |
| **BR-009** | Only the patient of an appointment and its assigned doctor can access its meeting room; access is enforced by signed JWT + ownership checks. |
| **BR-010** | A review may be deleted by its author; the doctor's aggregate rating/count must be recalculated. |
| **BR-011** | EMR records are accessible by the owning patient, the creating doctor, and admins only. |
| **BR-012** | Account deactivation by an admin must prevent the affected user from logging in/acting (auth middleware must check `isActive`). |
| **BR-013** | Rate-limit windows apply per IP (and per route class) and may be tuned via environment variables. |
| **BR-014** | The AI Assistant must always include a non-medical-advice disclaimer and must not claim a diagnosis. |

---

# 8. Traceability Matrix (Summary)

| Feature Area | Primary Requirements |
|--------------|----------------------|
| Auth & accounts | FR-AUTH-001…016 |
| Directory & discovery | FR-DOC-001…011 |
| Profiles & reviews | FR-REV-001…007 |
| Booking | FR-BOOK-001…015 |
| Reschedule/cancel | FR-RES-001…007 |
| Payments | FR-PAY-001…013 |
| Medical records | FR-EMR-001…011 |
| Video consultations | FR-MEET-001…007 |
| AI Assistant | FR-AI-001…008 |
| Doctor portal | FR-DOCP-001…008 |
| Admin portal | FR-ADM-001…009, FR-ANA-001…008 |
| Notifications | FR-NOT-001…004 |
| Platform/security | FR-SEC-001…014, NFR-SEC-001…010 |
| Performance | NFR-PERF-001…007 |
| Usability | NFR-USR-001…008 |
| Data integrity | D-001…006, BR-001…014 |

---

# 9. Appendices

## Appendix A: API Endpoint Reference

All endpoints are prefixed by the backend base URL (`http://localhost:5000` in
development). Success responses use `{ success, message, data }`.

### A.1 Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register patient (rate-limited) |
| POST | `/api/auth/login` | — | Patient login (rate-limited) |
| POST | `/api/auth/logout` | — | Clear auth cookie |
| GET | `/api/auth/me` | user | Current profile |
| PUT | `/api/auth/profile` | user | Update profile |
| PUT | `/api/auth/change-password` | user | Change password |

### A.2 Doctors — `/api/doctors` (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List (search/specialization/fee/experience/availability/sort/page/limit) |
| GET | `/api/doctors/:id` | Doctor detail |
| GET | `/api/doctors/specializations` | Distinct specializations |
| GET | `/api/doctors/stats` | Public statistics |

### A.3 Appointments — `/api/appointments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/appointments` | user | Book |
| GET | `/api/appointments/my` | user | My appointments (paginated) |
| GET | `/api/appointments/:id` | user/doctor | Detail |
| PUT | `/api/appointments/:id/reschedule` | user | Reschedule |
| PATCH | `/api/appointments/:id/cancel` | user | Cancel |

### A.4 Payments — `/api/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/checkout` | user | Create Stripe checkout session |
| GET | `/api/payments/history` | user | My payments |
| GET | `/api/payments/appointment/:appointmentId` | user | Payment for an appointment |
| GET | `/api/payments/:id` | user | Payment detail |
| POST | `/api/payments/:id/refund` | admin | Refund |
| POST | `/api/payments/webhook` | Stripe | Stripe webhook (raw body) |

### A.5 Reviews — `/api/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews/doctor/:doctorId` | — | Reviews for a doctor |
| GET | `/api/reviews/my/:doctorId` | user | My review for a doctor |
| POST | `/api/reviews` | user | Create review |
| DELETE | `/api/reviews/:id` | user | Delete review |

### A.6 Doctor — `/api/doctor`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctor/login` | Doctor login (rate-limited) |
| GET | `/api/doctor/profile` | Profile |
| PUT | `/api/doctor/profile` | Update profile (image upload) |
| PUT / PATCH | `/api/doctor/change-password` | Change password |
| GET | `/api/doctor/dashboard` | Dashboard stats |
| PATCH | `/api/doctor/availability` | Update availability |
| GET | `/api/doctor/appointments` | Appointments list |
| GET | `/api/doctor/appointments/:id` | Appointment detail |
| PATCH | `/api/doctor/appointments/:id` | Update status/notes/clinic payment |
| GET | `/api/doctor/payments` | Payment history |
| GET | `/api/doctor/payments/report` | Payment report |

### A.7 EMR — `/api/emr` (also aliased under `/api/doctor/emr`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/emr/records` | doctor/admin | List records |
| POST | `/api/emr/records` | doctor | Create record |
| PUT | `/api/emr/records/:id` | doctor | Update record |
| DELETE | `/api/emr/records/:id` | doctor | Delete record |
| POST | `/api/emr/records/:id/reports` | doctor | Upload reports (max 5) |
| DELETE | `/api/emr/records/:id/reports/:reportId` | doctor | Delete report |
| POST | `/api/emr/records/:id/followup` | doctor | Add follow-up note |
| POST | `/api/emr/records/:id/prescription-pdf` | doctor | Upload prescription PDF |
| GET | `/api/emr/patients` | doctor | Doctor's patients |
| GET | `/api/emr/my-records` | user | Patient's records |
| GET | `/api/emr/records/:id/prescription` | doctor/admin/user | Download prescription PDF |
| GET | `/api/emr/records/:id/reports/:reportId` | doctor/admin/user | Download report |

### A.8 Meetings — `/api/meetings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/meetings/:appointmentId` | user/doctor | Meeting room + Jitsi token |
| POST | `/api/meetings/:appointmentId/history` | user/doctor | Record join/leave/duration |

### A.9 AI Assistant — `/api/assistant`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assistant/symptom-check` | Symptom severity check (rate-limited) |
| POST | `/api/assistant/chat` | Chat: FAQs, tips, doctor matching (rate-limited) |
| GET | `/api/assistant/faqs` | FAQ list |
| GET | `/api/assistant/health-tips` | Health tips |

### A.10 Admin — `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (rate-limited) |
| GET | `/api/admin/profile` | Profile |
| PUT | `/api/admin/profile` | Update profile |
| PATCH | `/api/admin/change-password` | Change password |
| GET | `/api/admin/dashboard` | Dashboard KPIs |
| GET | `/api/admin/analytics` | Analytics |
| GET | `/api/admin/analytics/export` | Export report |
| GET/POST/PUT/DELETE | `/api/admin/doctors…` | Doctor CRUD + status toggle + image upload |
| GET/PATCH/DELETE | `/api/admin/appointments…` | Appointment management |
| GET/PATCH/DELETE | `/api/admin/patients…` | Patient management |
| GET/PATCH | `/api/admin/payments…` | Payment management + refunds |
| GET | `/api/admin/payments/report` | Payment report |

## Appendix B: Analytics Metrics and Periods

**Periods:** `7d`, `30d` (default), `3m`, `6m`, `12m`, `all`.

**Analytics payload keys:**

| Key | Content |
|-----|---------|
| `period`, `from`, `to` | Query metadata |
| `stats` | Totals, earnings, completion/cancellation rates, video & online-payment share, peak hour/day |
| `daily`, `weekly`, `monthly` | Appointment & revenue trend series |
| `statusDistribution` | Appointment status breakdown |
| `revenueByStatus`, `revenueByType`, `revenueByMethod` | Revenue breakdowns |
| `revenueBySpecialization`, `revenueByDoctor` | Revenue attribution |
| `patientGrowth` | New patients over time |
| `doctorPerformance` | Per-doctor metrics |
| `mostBookedDoctors`, `topSpecializations` | Rankings |
| `peakHours`, `dayOfWeek` | Temporal distributions |
| `generatedAt` | Timestamp |

**Export formats:** `pdf`, `xlsx`, `csv`. CSV includes UTF-8 BOM; XLSX uses multiple styled sheets; PDF is paginated.

## Appendix C: Environment Configuration

Primary variables (full list in `backend/.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes (prod) | dev fallback | Long random secret |
| `PORT` | | `5000` | API port |
| `NODE_ENV` | | `development` | `production` enables strict validation & secure cookies |
| `JWT_EXPIRE` | | `7d` | Token lifetime |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | | — | Seeded admin credentials |
| `FRONTEND_URL` | | `http://localhost:5173` | Payment/email links |
| `CORS_ORIGINS` | | dev ports | Comma-separated allowed origins |
| `STRIPE_SECRET_KEY` | | empty → demo | Stripe key |
| `STRIPE_WEBHOOK_SECRET` | | empty | Webhook signature secret |
| `STRIPE_CURRENCY` | | `PKR` | Default currency |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | | empty → console | Email delivery |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` / `RATE_LIMIT_AUTH_MAX` | | `60000` / `300` / `10` | Rate-limit overrides |

## Appendix D: Default Accounts and Seed Data

The seed script (`npm run seed`) creates sample data **only on a fresh database**:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| Doctor | `michael@example.com` | `doctor123` |
| Patient | `patient@example.com` | `patient123` |

> ⚠️ The seed script overwrites existing doctor records and must never be run
> against a production or shared database.

## Appendix E: Glossary (Expanded)

| Term | Definition |
|------|-----------|
| **Clinic consultation** | An in-person visit to the doctor's clinic. |
| **Video consultation** | A remote consultation over a video call (Jitsi). |
| **Pay at clinic** | Payment made in cash or by card at the clinic on the visit day. |
| **Pay online** | Pre-paid consultation via Stripe Checkout (or demo). |
| **Demo mode** | Fallback payment flow used when no Stripe key is configured; payments auto-confirm. |
| **Receipt** | A PDF document generated for a paid payment. |
| **Symptom check** | AI Assistant feature mapping symptoms to severity/triage advice. |
| **FAQ** | Frequently Asked Questions answered by the AI Assistant. |
| **Jitsi token** | A signed JWT used to authenticate a participant to a Jitsi room. |
| **Blocked date** | A date on which the doctor is unavailable despite being a working day. |

---

*End of SRS — DocBook Doctor Appointment Booking System, v1.0.*
