# WellQC+ — 3-Month Development Sprint Plan (Updated Team Structure)

> **Project:** WellQC+ — AI-Powered Well Log Quality Assurance & Subsurface Analytics Platform  
> **Team Structure (8 Members):** 2 Software Engineers · 4 Data Analysts · 2 Cloud Engineers  
> **Timeline:** 3 Months (12 Weeks) · 6 × 2-Week Sprints  
> **Methodology:** Agile Scrum with 2-week sprint cycles

---

## 👥 Team Roles & Assigned Domains

| ID | Role | Name / Title | Primary Domain & Codebase Files |
|----|------|--------------|---------------------------------|
| **SE1** | Software Engineer 1 | Core Engine & AI Lead | [`parser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/parser.ts), [`quality-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/quality-engine.ts), [`ai-analyzer.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/ai-analyzer.ts), [`exporter.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/exporter.ts), [`log-viewer.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-viewer.tsx) |
| **SE2** | Software Engineer 2 | Full-Stack UI & API Lead | App Shell (`app-shell.tsx`, `sidebar.tsx`, `header.tsx`), Auth (`auth.ts`), Upload Workspace (`upload/page.tsx`), Wells (`wells/page.tsx`), Dashboard (`dashboard/page.tsx`), API Routes (`/api/*`) |
| **DA1** | Data Analyst 1 | Petrophysical Rules & Standardisation Lead | Standardisation Dictionary (`standardiser.ts`), Physical Min/Max Bounds, Mnemonic Aliases, Unit Conversions |
| **DA2** | Data Analyst 2 | Missing Value Diagnostics & Imputation Lead | Root Cause Diagnostics (`imputation-engine.ts`), KNN / Spline / Linear Benchmarking, RMSE / MAE Metrics |
| **DA3** | Data Analyst 3 | Basin Intelligence & Field Analytics Lead | Dashboard KPIs, 7-Day Rolling Trend, Field Performance Ranking, Anomaly Distribution Charts (`analytics/page.tsx`) |
| **DA4** | Data Analyst 4 | Reporting & Quality Audit Lead | PDF Audit Certificates (jsPDF), Excel/CSV Export templates (`reports/page.tsx`), Niger Delta Test LAS Dataset Validation |
| **CE1** | Cloud Engineer 1 | DevOps, Deployment & CI/CD Lead | Vercel Deployment (`vercel.json`), Domain & SSL HTTPS, GitHub Actions CI/CD, Load Testing & Monitoring |
| **CE2** | Cloud Engineer 2 | Database, Security & Microservice Lead | Prisma Schema (`schema.prisma`), Neon PostgreSQL (AWS us-east-1), Multi-Tenant Data Isolation (`ownerId`), Python FastAPI Microservice (`main.py`) |

---

## 🗓️ Sprint Overview (12-Week Arc)

```
Month 1                        Month 2                        Month 3
─────────────────────────────────────────────────────────────────────
Sprint 1         Sprint 2      Sprint 3        Sprint 4      Sprint 5         Sprint 6
Wk 1–2          Wk 3–4        Wk 5–6          Wk 7–8        Wk 9–10          Wk 11–12
Discovery &     Foundation    Core Engine &   Advanced      QA, Security     Production
Architecture    & Auth Setup  LAS Pipeline    Features      & Compliance     Launch & Demo
```

---

---

# 🔵 SPRINT 1 — Discovery, Architecture & Setup

**Duration:** Week 1–2  
**Theme:** Lock technical stack, petrophysical boundaries, database design, and cloud environments.

---

### 💻 Software Engineers
- **SE1 (Core Engine Lead)**
  - Establish `ParsedLAS` interface specification covering `~VERSION`, `~WELL`, `~CURVE`, and `~ASCII` data structures.
  - Architect the 3-stage pipeline contract: `Parser` → `Standardiser` → `Quality Engine` → `Exporter`.
  - Set up TypeScript strict mode rules and base type declarations in `src/lib/api-types.ts`.
- **SE2 (Full-Stack UI Lead)**
  - Initialize Next.js 15 App Router project with TypeScript and Tailwind CSS.
  - Configure path aliases (`@/*`), ESLint, Prettier, and basic directory structure.
  - Build initial project scaffold and Git repository.

### 📊 Data Analysts
- **DA1 (Petrophysical Rules Lead)**
  - Research and compile standard petrophysical physical bounds for 8 core curve types:
    - `GR` (0–150 GAPI), `RHOB` (1.65–2.65 g/cc), `NPHI` (0–0.60 v/v), `DT` (40–240 μs/ft), `RT` (0.02–2000 OHMM), `CALI` (6–16 IN), `PEF` (0.5–15.0 B/E), `SP` (-250–250 MV).
  - List acceptable unit strings per curve (`GAPI`, `G/CC`, `V/V`, `US/F`, `OHMM`, `IN`).
- **DA2 (Imputation Lead)**
  - Define petrophysical root cause classification logic for missing values:
    - *Casing Shoe Boundary*: Shallow depth null transitions.
    - *Borehole Washout*: High CALI readings (>15.5 in) correlating with missing density/neutron points.
    - *Telemetry Dropout*: Large contiguous missing blocks across all channels.
    - *Off-Bottom Window*: Missing readings at start/stop depths.
- **DA3 (Basin Intelligence Lead)**
  - Define dashboard metrics requirement specification: 8 KPI cards, 7-day trend metrics, Field Performance scoring rules.
- **DA4 (Reporting & Quality Auditor)**
  - Define PDF audit certificate layout requirements and required compliance header fields.

### ☁️ Cloud Engineers
- **CE1 (DevOps Lead)**
  - Create Vercel project linked to GitHub repository (`main` and `develop` branches).
  - Configure build commands and environment variable bindings in Vercel dashboard.
- **CE2 (Database & Security Lead)**
  - Provision Neon PostgreSQL database instance (`neondb`) on AWS us-east-1 with pooled (`-pooler`) and direct connection strings.
  - Initialize Prisma ORM (`npx prisma init`) and write initial schema draft.
  - Set up Python FastAPI microservice skeleton in `services/python_parser/`.

---

---

# 🟢 SPRINT 2 — Foundation, Auth & Multi-Tenant Database

**Duration:** Week 3–4  
**Theme:** Full Prisma schema, authentication stack, route protection middleware, and responsive app shell.

---

### 💻 Software Engineers
- **SE1 (Core Engine Lead)**
  - Build [`src/lib/auth.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/auth.ts): password hashing with `scrypt` + 16-byte random salt, HMAC-SHA256 session token generation with 7-day expiry.
  - Implement `verifyPassword` using `crypto.timingSafeEqual` to prevent timing attacks.
  - Create `readSession` and `getCurrentUser` session helpers.
- **SE2 (Full-Stack UI Lead)**
  - Build public **Landing Page** (`src/app/page.tsx`) with Hero, About Us, Services, Pricing, and Contact sections, including sticky `landing-navbar.tsx`.
  - Build Auth API routes: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/auth/me`.
  - Build `/login` and `/register` pages with form validation and httpOnly session cookies.
  - Create root [`middleware.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/middleware.ts) protecting all app routes except `/login`, `/register`, and the public landing page.
  - Build responsive [`app-shell.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/layout/app-shell.tsx), [`sidebar.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/ui/sidebar.tsx) with mobile drawer navigation, and [`header.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/ui/header.tsx).

### 📊 Data Analysts
- **DA1 (Petrophysical Rules Lead)**
  - Build comprehensive raw mnemonic alias dictionary mapping table for `standardiser.ts`:
    - `GR` aliases: `['GR', 'GAMMA', 'GRC', 'GAM', 'GR_CORR', 'SGR']`
    - `RHOB` aliases: `['RHOB', 'DEN', 'RHOZ', 'BDEN', 'ZDEN']`
    - `NPHI` aliases: `['NPHI', 'NEUT', 'CNL', 'NPOR', 'TNPH']`
    - `DT` aliases: `['DT', 'DTCO', 'AC', 'DTC', 'SONI']`
- **DA2 (Imputation Lead)**
  - Benchmark standard baseline algorithms (Linear Interpolation, Mean, Median, Row Dropping) on preliminary dataset.
- **DA3 (Basin Intelligence Lead)**
  - Map field names and operators in Niger Delta basin for database seeding.
- **DA4 (Reporting & Quality Auditor)**
  - Collect 10 real-world LAS test files representing Niger Delta wells for testing parser boundary limits.

### ☁️ Cloud Engineers
- **CE1 (DevOps Lead)**
  - Configure SSL/TLS enforcing HTTPS headers in `next.config.js` and Vercel edge routes.
  - Set up automated GitHub Actions workflow for linting and build checks on pull requests.
- **CE2 (Database & Security Lead)**
  - Finalize [`schema.prisma`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/prisma/schema.prisma): `User` (including billing fields: `tier`, `freeChecksUsed`, `stripeCustomerId`, `stripeSubscriptionId`), `Well`, `LASFile`, `Curve`, `QualityReport`, `Anomaly`, `ActivityLog`, `APIToken`, `Field`, `Operator`.
  - Enforce data isolation by adding `ownerId` foreign key to `Well` with `@@index([ownerId])`.
  - Execute `npx prisma db push` to push schema to Neon PostgreSQL.
  - Build [`src/lib/db.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/db.ts) Prisma Client singleton to prevent dev HMR connection pool exhaustion.

---

---

# 🟡 SPRINT 3 — Core Engine, Quality Scoring & LAS Upload

**Duration:** Week 5–6  
**Theme:** LAS file parser, quality scoring engine, standardisation engine, and database persistence transaction.

---

### 💻 Software Engineers
- **SE1 (Core Engine Lead)**
  - Build [`parser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/parser.ts): parse Version 2.0, Well Info, Curve Metadata, and ASCII Data sections. Normalize null indicators (`-999.25`, `-9999`, `NaN`, blanks).
  - Build [`quality-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/quality-engine.ts):
    - Physical limit checks (`IMPOSSIBLE_VALUE`)
    - Spike detection via Z-Score > 4.0 (`EXTREME_SPIKE`)
    - Sensor flatline detection > 25 points (`FLATLINE`)
    - Depth gap detection > 5× step size (`DEPTH_GAP`)
    - Null cluster detection (`NULL_CLUSTER`)
    - Weighted scoring formula: $(0.50 \times \text{Health}) + (0.30 \times \text{Completeness}) + (0.20 \times \text{Consistency})$.
  - Build [`ai-analyzer.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/ai-analyzer.ts) expert system for text recommendation generation.
  - Build [`exporter.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/exporter.ts) to construct cleaned LAS 2.0 export files with duplicate depth removal.
- **SE2 (Full-Stack UI Lead)**
  - Build Drag-and-Drop upload UI in [`src/app/upload/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/upload/page.tsx).
  - Build Well management pages: [`wells/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/page.tsx) and [`wells/[id]/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/[id]/page.tsx).
  - Build REST API routes with owner isolation: `GET/POST /api/wells`, `GET/DELETE /api/wells/[id]`.

### 📊 Data Analysts
- **DA1 (Petrophysical Rules Lead)**
  - Build [`standardiser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/standardiser.ts) with exact and alias lookup logic + confidence scoring (1.0 exact, 0.95 alias, 0.50 fallback).
- **DA2 (Imputation Lead)**
  - Calibrate spike threshold Z-score ($4.0\sigma$) and flatline step size ($25$ consecutive points) against noisy log channels.
- **DA3 (Basin Intelligence Lead)**
  - Verify well metadata auto-extraction from LAS header (`WELL`, `COMP`, `FLD`, `LOC`, `API`).
- **DA4 (Reporting & Quality Auditor)**
  - Perform test uploads of 10 LAS test files; verify quality engine accurately categorizes files into EXCELLENT (≥90), GOOD (75–89), POOR (50–74), and CRITICAL (<50).

### ☁️ Cloud Engineers
- **CE1 (DevOps Lead)**
  - Optimize build performance and chunk splitting in Next.js.
- **CE2 (Database & Security Lead)**
  - Build atomic commit transaction in [`POST /api/las`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/api/las/route.ts):
    - Upsert Operator and Field.
    - Validate multi-tenant isolation: throw `Error("This API/UWI is already assigned to another workspace.")` if `existingWell.ownerId !== user.id`.
    - Create `LASFile`, `Curve` (with `dataJson`), `QualityReport`, `Anomaly`, and `ActivityLog` inside `db.$transaction()` with 30s timeout.

---

---

# 🟠 SPRINT 4 — Advanced Visualisation, Imputation & Analytics

**Duration:** Week 7–8  
**Theme:** Multi-track log viewer, KNN imputation benchmarking modal, command dashboard, and report generation.

---

### 💻 Software Engineers
- **SE1 (Core Engine Lead)**
  - Build Multi-Track Log Viewer component ([`log-viewer.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-viewer.tsx)):
    - Dual mode: Classic Paper Log View & Dark Subsurface View.
    - Track 1 (GR: 0–150 GAPI), Track 2 (RT: 0.2–2000 OHMM log scale), Track 3 (DT: 40–240 μs/ft, RHOB/NPHI).
    - SVG polyline rendering with missing null gap overlays and depth tick marks.
- **SE2 (Full-Stack UI Lead)**
  - Build Command Dashboard ([`dashboard/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/dashboard/page.tsx)) and `GET /api/dashboard`.
  - Build Imputation Benchmark Modal ([`imputation-benchmark-modal.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/imputation-benchmark-modal.tsx)).
  - Build QA Engine Page ([`qa-engine/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/qa-engine/page.tsx)) and Standardisation Dictionary page ([`standardisation/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/standardisation/page.tsx)).

### 📊 Data Analysts
- **DA1 (Petrophysical Rules Lead)**
  - Implement persistent custom alias registration (`addCustomAlias` & `getMergedStandardCurves`) stored in `localStorage` in `standardiser.ts`.
- **DA2 (Imputation Lead)**
  - Build Multi-Method Imputation Benchmarking Engine in [`imputation-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/imputation-engine.ts):
    - Benchmark 5 strategies: KNN (K-Nearest Neighbours), Linear Interpolation, Mean, Median, Cubic Spline, Row Dropping.
    - Ground-truth masking cross-validation to calculate RMSE, MAE, R² Score, Variance Preservation %, and Execution Speed.
- **DA3 (Basin Intelligence Lead)**
  - Build Field Performance ranking aggregation and Anomaly Distribution breakdown in `GET /api/analytics` and [`analytics/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/analytics/page.tsx).
- **DA4 (Reporting & Quality Auditor)**
  - Build PDF Audit Certificate generator (jsPDF), Excel Workbook exporter (SheetJS), and CSV logger in [`reports/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/reports/page.tsx).

### ☁️ Cloud Engineers
- **CE1 (DevOps Lead)**
  - Configure client-side memory limits and asset optimization for rendering long well log SVG curves.
- **CE2 (Database & Security Lead)**
  - Develop Python FastAPI microservice in [`services/python_parser/main.py`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/services/python_parser/main.py) with `lasio`, `pandas`, `numpy`, and `scikit-learn` (`KNNImputer`) endpoints for high-throughput batch processing.

---

---

# 🔴 SPRINT 5 — Security, Compliance & Multi-Tenant Audit

**Duration:** Week 9–10  
**Theme:** NDA acceptance gate, strict DB-level query isolation audit, activity trail, and load testing.

---

### 💻 Software Engineers
- **SE1 (Core Engine Lead)**
  - Implement NDA acceptance check in `getCurrentUser()` flow.
  - Build `/nda` page displaying Data Processing Agreement and "I Agree" button updating `user.ndaAcceptedAt`.
- **SE2 (Full-Stack UI Lead)**
  - Implement **Stripe Integration**: Add checkout API route (`/api/checkout`) and Stripe Webhook handler (`/api/webhooks/stripe`).
  - Build Activity Audit Trail page ([`activity/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/activity/page.tsx)) and `GET /api/activity`.
  - Build Well Comparison page ([`comparison/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/comparison/page.tsx)) for side-by-side QA comparison.
  - Implement Admin User Management page ([`admin/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/admin/page.tsx)).

### 📊 Data Analysts
- **DA1 (Petrophysical Rules Lead)**
  - Validate physical boundary error descriptions and suggested correction messages in `quality-engine.ts`.
- **DA2 (Imputation Lead)**
  - Review KNN cross-validation metrics across all 10 test wells; verify KNN achieves highest R² (>0.92) for GR/RHOB curves.
- **DA3 (Basin Intelligence Lead)**
  - Verify Dashboard 7-day rolling trend accurately aggregates live database telemetry.
- **DA4 (Reporting & Quality Auditor)**
  - Perform full end-to-end quality audit of generated PDF certificates, verifying all anomalies and AI summaries render correctly.

### ☁️ Cloud Engineers
- **CE1 (DevOps Lead)**
  - Execute concurrency load testing: simulate 20 concurrent LAS uploads and measure API response times.
  - Verify Vercel edge function timeouts and HTTPS SSL certificate status.
- **CE2 (Database & Security Lead)**
  - Implement **Freemium Check Middleware**: Wrap log processing logic to reject uploads with `402 Payment Required` if user is on `FREE` tier and `freeChecksUsed >= 2`.
  - Perform strict Multi-Tenant Data Isolation Audit across ALL API routes (`/api/wells`, `/api/wells/[id]`, `/api/dashboard`, `/api/analytics`, `/api/las`):
    - Verify every query enforces `where: { ownerId: user.id }` or `{ well: { ownerId: user.id } }`.
    - Verify cross-tenant URL access attempts return `404 Not Found`.

---

---

# 🟣 SPRINT 6 — Production Deployment, Demo & Retrospective

**Duration:** Week 11–12  
**Theme:** Production deployment, demo well dataset seeding, documentation, and stakeholder presentation.

---

### 💻 Software Engineers
- **SE1 (Core Engine Lead)**
  - Final code review of parser, quality engine, standardiser, and exporter modules.
  - Ensure zero TypeScript compiler errors (`npm run build`).
- **SE2 (Full-Stack UI Lead)**
  - Polish UI animations, empty states, loading skeletons, and toast notifications.
  - Verify responsive rendering across Mobile (375px), Tablet (768px), and Desktop (1440px).

### 📊 Data Analysts
- **DA1 (Petrophysical Rules Lead)**
  - Final review of petrophysical standardisation dictionary and curve alias mappings.
- **DA2 (Imputation Lead)**
  - Prepare petrophysical missing value origin & KNN benchmarking presentation slides for stakeholders.
- **DA3 (Basin Intelligence Lead)**
  - Verify field performance ranking and problem wells dataset for presentation.
- **DA4 (Reporting & Quality Auditor)**
  - Prepare 6 pre-validated Niger Delta demo LAS files (1 EXCELLENT, 2 GOOD, 2 POOR, 1 CRITICAL) and seed script.

### ☁️ Cloud Engineers
- **CE1 (DevOps Lead)**
  - Trigger production build deployment on Vercel (`https://*.vercel.app`).
  - Verify domain mapping, SSL certificate, and production environment variables.
- **CE2 (Database & Security Lead)**
  - Perform production Neon PostgreSQL database migration and seed script execution.
  - Dockerize and deploy Python FastAPI microservice to cloud container hosting.

---

---

## 📊 Summary of Tasks by Role Across All 6 Sprints

```
WellQC+ Development Team (8 Members)
│
├── 🧑‍💻 SE1 (Core Engine Lead)
│    ├─ S1: Architecture & Pipe Contract  ├─ S2: Scrypt/HMAC Auth Engine
│    ├─ S3: LAS Parser & Quality Engine   ├─ S4: Log Viewer & Exporter
│    └─ S5: NDA Enforcement Gate          └─ S6: Code Review & Build Verification
│
├── 🧑‍💻 SE2 (Full-Stack UI Lead)
│    ├─ S1: Next.js Setup & Directory     ├─ S2: Landing Page, Auth & Shell
│    ├─ S3: Upload UI & Well CRUD Pages   ├─ S4: Dashboard, QA Engine & Benchmark Modal
│    └─ S5: Stripe API & Audit Pages      └─ S6: UI Polish & Cross-Device Audit
│
├── 📊 DA1 (Petrophysical Rules Lead)
│    ├─ S1: Curve Physical Limits (8)     ├─ S2: Raw Mnemonic Alias Dictionary
│    ├─ S3: Standardiser Confidence Logic ├─ S4: Persistent Custom Alias Feature
│    └─ S5: Anomaly Description Audit     └─ S6: Final Dictionary Sign-Off
│
├── 📊 DA2 (Missing Value & Imputation Lead)
│    ├─ S1: Origin Causes Definition      ├─ S2: Imputation Baseline Research
│    ├─ S3: Anomaly Threshold Calibration ├─ S4: Multi-Method KNN Benchmark Engine
│    └─ S5: RMSE/MAE Cross-Validation     └─ S6: Stakeholder Benchmarking Presentation
│
├── 📊 DA3 (Basin Intelligence Lead)
│    ├─ S1: Dashboard KPI Requirements    ├─ S2: Basin Metadata Mapping
│    ├─ S3: Well Metadata Auto-Extract    ├─ S4: Analytics & Field Ranking
│    └─ S5: 7-Day Trend Verification      └─ S6: Field Performance Presentation
│
├── 📊 DA4 (Reporting & Quality Auditor)
│    ├─ S1: PDF Certificate Layout Req    ├─ S2: 10 Niger Delta Test LAS Dataset
│    ├─ S3: Quality Grade Verification    ├─ S4: PDF / Excel / CSV Exporters
│    └─ S5: End-to-End Audit Certificate  └─ S6: Demo Dataset Seeding
│
├── ☁️ CE1 (DevOps & CI/CD Lead)
│    ├─ S1: Vercel Setup & Environment    ├─ S2: SSL HTTPS & GitHub Actions
│    ├─ S3: Next.js Chunk Optimization    ├─ S4: SVG Rendering Performance Tuning
│    └─ S5: Concurrency Load Testing      └─ S6: Production Release & Domain Config
│
└── ☁️ CE2 (Database & Security Lead)
     ├─ S1: Neon PostgreSQL Provisioning  ├─ S2: Full Prisma Schema (w/ Billing) & Owner Index
     ├─ S3: Multi-Tenant DB Transaction   ├─ S4: FastAPI Python Microservice
     └─ S5: Freemium Checks & Isolation   └─ S6: Prod DB Migration & Python Deploy
```

---

> **WellQC+ v2.4.0-Enterprise** | Subsurface Analytics Platform  
> Updated 3-Month Sprint Plan · 8 Team Members (2 SE, 4 DA, 2 CE) · 6 Sprints · 100% Grounded in Codebase.
