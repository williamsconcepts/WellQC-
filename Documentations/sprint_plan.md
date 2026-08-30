# WellQC+ — Master 3-Month Development Sprint Plan & Ownership Matrix

> **Project:** WellQC+ — AI-Powered Well Log Quality Assurance & Subsurface Analytics Platform  
> **Team Structure (8 Members):** 2 Software Engineers · 4 Data Analysts · 2 Cloud Engineers  
> **Timeline:** 3 Months (12 Weeks) · 6 × 2-Week Sprints  
> **Active Sprint:** Sprint 5 — Security, Paystack Monetization & Freemium Enforcement  
> **Methodology:** Agile Scrum with 2-Week Sprint Cycles  

---

## 🏗️ 1. Current Codebase Implementation Audit

The WellQC+ platform is structured as a full-stack, enterprise-grade AI well log quality assurance platform:

### 1. Core Petrophysical & AI Engines (`src/lib/las/`)
* **LAS Parser Engine ([`parser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/parser.ts))**: Native TypeScript parser for LAS 2.0/3.0 files (`~Version`, `~Well`, `~Curve`, and `~ASCII` sections), normalizes null indicators (`-999.25`, `-9999`, `NaN`), and handles depth intervals.
* **Quality Scoring Engine ([`quality-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/quality-engine.ts))**: Computes Curve Health, Completeness, Consistency, and the composite Quality Score ($0\text{--}100$) with physical limit violations, Z-score spike detection ($>4.0\sigma$), sensor flatlines ($>25$ steps), and depth gap analysis.
* **AI Recommendation Engine ([`ai-analyzer.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/ai-analyzer.ts))**: Rule-based expert system generating natural-language petrophysical risk summaries, confidence scores, and remediation steps.
* **Mnemonic Standardiser ([`standardiser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/standardiser.ts))**: Maps raw vendor mnemonics (`GAMMA`, `DEN`, `CNL`, `ILD`, `AC`) to standard API mnemonics (`GR`, `RHOB`, `NPHI`, `RT`, `DT`) with confidence weighting and custom alias persistence.
* **Missing Value & Imputation Engine ([`imputation-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/imputation-engine.ts))**: Diagnoses 4 root causes (casing shoe, washout, telemetry dropout, off-bottom) and benchmarks 5 imputation algorithms (KNN, Cubic Spline, Linear, Mean, Median) with ground-truth cross-validation calculating RMSE, MAE, R², variance preservation, and speed.
* **Cleaned LAS & Report Exporter ([`exporter.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/exporter.ts))**: Generates standard LAS 2.0 text exports with duplicate depth removal, plus CSV, Excel, and PDF certificates.

### 2. Paystack Payment & Monetization System (`src/lib/paystack.ts`)
* **Payment Gateway**: Integration with Paystack supporting Nigerian Naira (₦ NGN) and US Dollars ($ USD) via Cards (Verve, Mastercard, Visa), Direct Bank Transfers, and USSD.
* **API Endpoints**: `/api/paystack/initialize`, `/api/paystack/verify`, `/api/paystack/webhook`, `/api/checkout`, and `/api/las/check`.
* **Payment Modal (`payment-modal.tsx`)**: React Portal (`createPortal`) modal mounted on `document.body` at `z-[99999]` with currency toggles (₦ / $), monthly/annual billing, and live checkout triggers.
* **Pricing Portal (`/pricing`)**: Full public pricing page comparing Starter Free (2 checks), Pro Petrophysicist (₦75,000/mo or $50/mo), and Enterprise Hub.

### 3. Application UI & Dashboard Modules (`src/app/`)
* **Navigation & Shell**: `app-shell.tsx`, responsive `sidebar.tsx` with mobile drawer, and `header.tsx` with RBAC role switcher (`ADMIN`, `PETROPHYSICIST`, `DATA_ENGINEER`, `GEOSCIENTIST`, `VIEWER`).
* **Upload Workspace (`upload/page.tsx`)**: Drag-and-drop LAS ingestion, pre-validation checks, multi-track wireline rendering, and database commit.
* **Quality Control Command Center (`dashboard/page.tsx`)**: 8 live telemetry KPI cards, 7-day rolling quality trend chart, field performance breakdown, and problem wells list.
* **Asset & Well Management (`wells/page.tsx`, `wells/[id]/page.tsx`)**: Well inventories, geographic coordinates, curve channels, and audit history.
* **Specialized Pages**: QA Engine (`qa-engine/page.tsx`), Standardisation Dictionary (`standardisation/page.tsx`), Analytics (`analytics/page.tsx`), Well Comparison (`comparison/page.tsx`), Audit Reports (`reports/page.tsx`), Activity Log (`activity/page.tsx`), and Admin Panel (`admin/page.tsx`).

### 4. Database & Infrastructure (`prisma/`)
* **Database**: Neon PostgreSQL on AWS us-east-1 with connection pooling.
* **Schema (`schema.prisma`)**: Models for `User`, `Well`, `LASFile`, `Curve`, `QualityReport`, `Anomaly`, `ActivityLog`, `APIToken`, `Field`, `Operator`.
* **Multi-Tenant Isolation**: Enforced via `ownerId` foreign key and query filters across all API routes.

---

## 👥 2. Team Roles & Ownership Matrix

The team consists of **8 members** organized into 3 primary divisions:

| Role ID | Role Title | Primary Codebase Files & Modules | Core Focus Area |
|---|---|---|---|
| **SE1** | Software Engineer 1 (Core Engine & AI Lead) | `parser.ts`, `quality-engine.ts`, `ai-analyzer.ts`, `exporter.ts`, `log-viewer.tsx` | LAS parsing algorithms, quality scoring mathematics, AI recommendation generation, wireline rendering, and type safety. |
| **SE2** | Software Engineer 2 (Full-Stack UI & API Lead) | `app-shell.tsx`, `sidebar.tsx`, `header.tsx`, `auth.ts`, `paystack.ts`, `payment-modal.tsx`, `/api/*` | App UI, responsive design, Paystack payment integration, REST API routes, auth flows, and frontend state management. |
| **DA1** | Data Analyst 1 (Petrophysical Rules & Standardisation Lead) | `standardiser.ts`, `standardisation/page.tsx` | Physical boundary thresholds, curve mnemonic aliases, confidence scoring weights, and petrophysical dictionary standards. |
| **DA2** | Data Analyst 2 (Missing Value & Imputation Lead) | `imputation-engine.ts`, `imputation-benchmark-modal.tsx` | Root-cause missing value diagnostics (washout, casing shoe), algorithm benchmarking (KNN vs Spline vs Linear), and RMSE/MAE validation. |
| **DA3** | Data Analyst 3 (Basin Intelligence & Field Analytics Lead) | `dashboard/page.tsx`, `analytics/page.tsx`, `/api/dashboard`, `/api/analytics` | Dashboard KPIs, 7-day rolling quality trends, Niger Delta field performance rankings, and anomaly distribution charts. |
| **DA4** | Data Analyst 4 (Reporting & Quality Audit Lead) | `reports/page.tsx`, `sample-las-files.ts` | PDF audit certificate layout & compliance, Excel/CSV export validation, and real-world Niger Delta test LAS file curation. |
| **CE1** | Cloud Engineer 1 (DevOps, CI/CD & Performance Lead) | `vercel.json`, `next.config.js`, `.github/workflows/` | Vercel deployments, custom domains, SSL/TLS certificates, GitHub Actions CI/CD pipelines, and performance optimization. |
| **CE2** | Cloud Engineer 2 (Database, Security & Microservice Lead) | `schema.prisma`, `db.ts`, `POST /api/las`, `services/python_parser/` | Neon PostgreSQL provisioning, Prisma ORM schema migrations, multi-tenant DB isolation audits, and Python FastAPI microservice. |

---

## 📅 3. Master Sprint Plans & Responsibilities (Sprint 1 to Deployment)

The project roadmap spans **6 two-week sprints (12 weeks)**:

```
Month 1                        Month 2                        Month 3
─────────────────────────────────────────────────────────────────────
Sprint 1         Sprint 2      Sprint 3        Sprint 4      Sprint 5         Sprint 6
Wk 1–2          Wk 3–4        Wk 5–6          Wk 7–8        Wk 9–10          Wk 11–12
Discovery &     Foundation    Core Engine &   Advanced      Security &       Production
Architecture    & Auth Setup  LAS Ingestion   Visualisation Monetization     Release & Demo
```

---

### 🔵 SPRINT 1 (Weeks 1–2): Discovery, Architecture & Core Stack
* **Theme:** Establish data contracts, petrophysical boundaries, database design, and cloud environments.
* **SE1:** Design `ParsedLAS` interface specification; architect the 4-stage pipeline contract (`Parser` → `Standardiser` → `Quality Engine` → `Exporter`); set up strict TypeScript definitions in `src/lib/api-types.ts`.
* **SE2:** Scaffold Next.js 15 App Router with TypeScript & Tailwind CSS; configure directory layout, path aliases (`@/*`), `.eslintrc.json`, `.prettierrc`, and base components.
* **DA1:** Compile standard measurement physical limits for 8 core curve types (`GR`, `RHOB`, `NPHI`, `DT`, `RT`, `CALI`, `PEF`, `SP`) and standard unit strings.
* **DA2:** Define petrophysical root cause rules for missing values (Casing Shoe, Borehole Washout, Telemetry Dropout, Off-Bottom Window).
* **DA3:** Draft specifications for Dashboard telemetry KPIs, 7-day trend metrics, and field performance scoring.
* **DA4:** Define PDF audit certificate layout and compliance header requirements.
* **CE1:** Initialize Vercel deployment project linked to GitHub repository; configure build commands and environment variables.
* **CE2:** Provision Neon PostgreSQL on AWS us-east-1; initialize Prisma ORM schema; scaffold Python FastAPI microservice skeleton in `services/python_parser/`.

---

### 🟢 SPRINT 2 (Weeks 3–4): Foundation, Auth & Multi-Tenant Database
* **Theme:** Database schema push, authentication stack, route protection middleware, and responsive app shell.
* **SE1:** Build [`src/lib/auth.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/auth.ts) password hashing with scrypt + random salt; implement `verifyPassword` with `timingSafeEqual` and HMAC session token helpers.
* **SE2:** Build public Landing Page (`src/app/page.tsx`); build Auth API routes (`/api/auth/login`, `/register`, `/logout`, `/me`); build `app-shell.tsx`, `sidebar.tsx`, `header.tsx`, and `middleware.ts`.
* **DA1:** Build initial raw mnemonic alias dictionary for standardisation (mapping `GAMMA`, `DEN`, `CNL`, `AC` to API standards).
* **DA2:** Benchmark baseline imputation algorithms (Mean, Median, Linear Interpolation, Row Dropping).
* **DA3:** Compile Niger Delta basin field names and operator directory for seeding.
* **DA4:** Curate initial set of 10 real-world LAS test files representing varying quality levels.
* **CE1:** Configure SSL/TLS HTTPS headers and automated GitHub Actions build verification.
* **CE2:** Finalize `schema.prisma` (`User`, `Well`, `LASFile`, `Curve`, `QualityReport`, `Anomaly`, `ActivityLog`); enforce `ownerId` indexing; execute `prisma db push`; build `db.ts` singleton.

---

### 🟡 SPRINT 3 (Weeks 5–6): Core Engine, Quality Scoring & Ingestion Workspace
* **Theme:** LAS parsing engine, composite quality scoring, standardisation engine, and atomic database commits.
* **SE1:** Build `parser.ts` with null normalization; build `quality-engine.ts` with spike/flatline/gap anomaly detection and weighted formula; build `ai-analyzer.ts` and `exporter.ts`.
* **SE2:** Build Drag-and-Drop LAS Ingestion UI (`src/app/upload/page.tsx`); build Well asset management pages (`wells/page.tsx`, `wells/[id]/page.tsx`) and `/api/wells` endpoints.
* **DA1:** Implement `standardiser.ts` with exact/alias lookup and confidence scoring (1.0 exact, 0.95 alias, 0.50 fallback).
* **DA2:** Calibrate spike Z-score threshold ($4.0\sigma$) and flatline detection steps ($25$ consecutive depth samples).
* **DA3:** Verify automatic metadata extraction from LAS headers (`WELL`, `COMP`, `FLD`, `LOC`, `API`).
* **DA4:** Run test uploads on 10 LAS test files to verify grade categorization (`EXCELLENT` $\ge 90$, `GOOD` $75\text{--}89$, `POOR` $50\text{--}74$, `CRITICAL` $<50$).
* **CE1:** Optimize Next.js chunk splitting and bundle size.
* **CE2:** Build atomic transaction in `POST /api/las` with `db.$transaction()` ensuring multi-tenant workspace isolation.

---

### 🟠 SPRINT 4 (Weeks 7–8): Advanced Visualisation, Imputation & Analytics
* **Theme:** Wireline multi-track log viewer, KNN imputation cross-validation, dashboard telemetry, and report generation.
* **SE1:** Build Multi-Track Wireline Log Viewer (`log-viewer.tsx`) supporting Track 1 (`GR`), Track 2 (`RT` log scale), Track 3 (`DT`/`RHOB`/`NPHI`), and missing-null gap overlays in Classic Paper & Dark Subsurface views.
* **SE2:** Build Command Dashboard (`dashboard/page.tsx`), QA Engine UI (`qa-engine/page.tsx`), and Standardisation Dictionary page (`standardisation/page.tsx`).
* **DA1:** Build persistent custom alias registration (`addCustomAlias` stored in `localStorage`) in `standardiser.ts`.
* **DA2:** Implement Multi-Method Imputation Benchmarking Engine in `imputation-engine.ts` (KNN, Cubic Spline, Linear, Mean, Median) with ground-truth cross-validation calculating RMSE, MAE, R², and variance preservation.
* **DA3:** Build Field Performance ranking calculations and Anomaly Distribution aggregations for `analytics/page.tsx`.
* **DA4:** Implement PDF Audit Certificate generator (jsPDF), Excel Workbook exporter (SheetJS), and CSV logger in `reports/page.tsx`.
* **CE1:** Optimize client-side memory usage and SVG rendering performance for large log files (>10,000 depth samples).
* **CE2:** Implement Python FastAPI microservice (`services/python_parser/main.py`) with `lasio`, `pandas`, and `scikit-learn` (`KNNImputer`) endpoints.

---

### 🔴 SPRINT 5 (Weeks 9–10): Security, Paystack Monetization & Freemium Enforcement (Current Active Sprint)
* **Theme:** Paystack payment integration for Nigeria & global markets, freemium limit enforcement, User Profile & Billing management, activity audit trail, and multi-tenant security audit.
* **SE1:** Review quality scoring and imputation pipeline for production edge cases; enforce NDA acceptance checks.
* **SE2:**
  - Implement Paystack Payment Integration (`paystack.ts`) with Naira (₦ NGN) and Dollar ($ USD) currency support, card/transfer/USSD channels, and sandbox fallback.
  - Build `PaymentModal` using React `createPortal` with `z-[99999]` and public Pricing Portal (`/pricing`).
  - Build Paystack API routes: `/api/paystack/initialize`, `/api/paystack/verify`, `/api/paystack/webhook`, and `/api/checkout`.
  - Build User Profile & Billing Management page (`/profile` & `/api/user/profile`) for managing account credentials, viewing Paystack transaction references, and managing subscriptions.
  - Build Activity Audit Trail (`activity/page.tsx`), Well Comparison (`comparison/page.tsx`), and Admin Panel (`admin/page.tsx`).
* **DA1:** Audit anomaly messages and petrophysical physical boundaries for accuracy against Niger Delta reservoir data.
* **DA2:** Validate KNN cross-validation metrics across test wells; confirm KNN achieves highest R² ($>0.92$) for `GR`/`RHOB` logs.
* **DA3:** Validate Dashboard 7-day rolling trend telemetry and field ranking accuracy against committed database wells.
* **DA4:** Conduct full quality audit on generated PDF certificates, verifying anomaly counts and AI text formatting.
* **CE1:** Execute load testing for concurrent LAS uploads; verify Vercel serverless function timeouts and SSL/TLS HTTPS configuration.
* **CE2:**
  - Implement Freemium Limit Enforcement (`/api/las/check`): Enforce 2 free LAS checks on FREE tier, rejecting further uploads with `402 Payment Required` until upgraded via Paystack.
  - Perform strict Multi-Tenant Data Isolation Audit across all API routes (`/api/wells`, `/api/wells/[id]`, `/api/dashboard`, `/api/analytics`, `/api/las`), ensuring cross-tenant queries return `404 Not Found`.

---

### 🟣 SPRINT 6 (Weeks 11–12): Production Deployment, Demo & Launch
* **Theme:** Production release, demo dataset seeding, documentation sign-off, and stakeholder presentation.
* **SE1:** Conduct final code review of parser, quality engine, standardiser, and exporter; ensure zero TypeScript compiler warnings or errors (`npm run build`).
* **SE2:** Final UI polish (animations, loading skeletons, responsive checks on 375px mobile, 768px tablet, 1440px desktop); verify Paystack webhook live endpoints.
* **DA1:** Sign off on standardisation dictionary, curve alias mappings, and physical boundaries.
* **DA2:** Prepare petrophysical root-cause diagnostics and KNN imputation benchmarking slides for stakeholder demo.
* **DA3:** Finalize problem wells and field performance presentation metrics.
* **DA4:** Seed 6 pre-validated Niger Delta demo LAS files (1 EXCELLENT, 2 GOOD, 2 POOR, 1 CRITICAL) for demonstration.
* **CE1:** Trigger production Vercel deployment; configure custom domain (`https://*.wellqc.com`), SSL certificates, and environment variables.
* **CE2:** Execute production Neon PostgreSQL database migration and seed script; deploy Python FastAPI microservice to cloud container hosting.

---

## 📊 4. Quick Reference Responsibility Matrix

```
WellQC+ Development Team (8 Members)
│
├── 🧑‍💻 SE1 (Core Engine & AI Lead)
│    ├─ S1: Architecture & Data Pipeline Contract  ├─ S2: Scrypt & HMAC Auth Engine
│    ├─ S3: LAS Parser & Quality Engine Scoring   ├─ S4: Multi-Track Viewer & Exporter
│    └─ S5: NDA Enforcement & Engine Refinements  └─ S6: Code Review & Build Sign-Off
│
├── 🧑‍💻 SE2 (Full-Stack UI & API Lead)
│    ├─ S1: Next.js Setup & Directory Scaffold    ├─ S2: Landing Page, Auth Pages & Shell
│    ├─ S3: Upload UI & Well CRUD Pages           ├─ S4: Dashboard, QA Engine & Benchmark UI
│    └─ S5: Paystack Gateway, Pricing & Audit UI  └─ S6: UI Polish & Responsive Audit
│
├── 📊 DA1 (Petrophysical Rules & Standardisation Lead)
│    ├─ S1: 8 Core Curve Physical Limit Bounds    ├─ S2: Raw Mnemonic Alias Dictionary
│    ├─ S3: Standardiser Confidence Weighting     ├─ S4: Persistent Custom Alias Feature
│    └─ S5: Anomaly Description & Rule Audit      └─ S6: Petrophysical Dictionary Sign-Off
│
├── 📊 DA2 (Missing Value & Imputation Lead)
│    ├─ S1: Root Cause Diagnostics Definition     ├─ S2: Baseline Imputation Benchmarks
│    ├─ S3: Spike & Flatline Threshold Tuning     ├─ S4: Multi-Method KNN Benchmark Engine
│    └─ S5: RMSE / MAE / R² Cross-Validation      └─ S6: Imputation Presentation & Slides
│
├── 📊 DA3 (Basin Intelligence & Field Analytics Lead)
│    ├─ S1: Dashboard KPI & Telemetry Specs       ├─ S2: Niger Delta Basin Field Directory
│    ├─ S3: Header Metadata Auto-Extraction       ├─ S4: Analytics & Field Ranking Logic
│    └─ S5: 7-Day Trend Telemetry Validation      └─ S6: Field Performance Demo Dataset
│
├── 📊 DA4 (Reporting & Quality Audit Lead)
│    ├─ S1: PDF Audit Certificate Layout Specs    ├─ S2: 10 Niger Delta Test LAS Dataset
│    ├─ S3: Quality Grade Range Verification      ├─ S4: PDF / Excel / CSV Exporters
│    └─ S5: Certificate Compliance Quality Audit  └─ S6: Demo Dataset Seeding & Sign-Off
│
├── ☁️ CE1 (DevOps, CI/CD & Performance Lead)
│    ├─ S1: Vercel Project & Environment Setup    ├─ S2: SSL HTTPS & GitHub Actions CI/CD
│    ├─ S3: Next.js Chunk Splitting Optimization  ├─ S4: SVG Rendering Performance Tuning
│    └─ S5: Concurrency Load & Latency Testing    └─ S6: Production Release & Custom Domain
│
└── ☁️ CE2 (Database, Security & Microservice Lead)
     ├─ S1: Neon PostgreSQL DB Provisioning       ├─ S2: Full Prisma Schema & Owner Indexes
     ├─ S3: Atomic Multi-Tenant DB Transaction    ├─ S4: Python FastAPI Imputation Service
     └─ S5: Freemium Checks & Multi-Tenant Audit  └─ S6: Production DB Migration & Deploy
```

---

> **WellQC+ v2.4.0-Enterprise** | Master Development Sprint Plan & Ownership Matrix  
> Updated & Grounded 100% in Codebase · 8 Team Members (2 SE, 4 DA, 2 CE) · 6 Sprints.
