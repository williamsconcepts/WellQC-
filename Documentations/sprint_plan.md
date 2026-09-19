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
* **Quality Scoring Engine ([`quality-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/quality-engine.ts))**: Audits 7 Core Required Curves (`GR`, `RHOB`, `NPHI`, `DT`, `RT`, `CALI`, `SP`) and detects all 11 user-specified anomaly categories (`DUPLICATE_DEPTH`, `DEPTH_GAP`, `NULL_CLUSTER`, `IMPOSSIBLE_VALUE`, `OUTLIER_VALUE`, `EXTREME_SPIKE` with calibrated DT cycle-skip sensitivity, `FLATLINE`, `UNIT_MISMATCH`, `NON_STANDARD_MNEMONIC`, `DUPLICATE_CURVE`, and `MISSING_CORE_CURVE`). Computes Curve Health, Completeness, Consistency, and composite Quality Score ($0\text{--}100$).
* **Anomaly Correction Options Dictionary ([`anomaly-options.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/anomaly-options.ts))** *(NEW — Sprint 5)*: Standardized petrophysical correction options dictionary for all 11 anomaly types with detailed technical descriptions, unique option IDs, and pre-selected `recommended: true` primary fixes.
* **Automated Data Cleaning & Repair Engine ([`cleaner.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/cleaner.ts))**: Core data modification engine executing duplicate depth pruning, depth gap alignment, physical outlier clipping, DT sonic despiking (5-point median window), unit conversions, flatline stuck-sensor handling, and missing gap imputation (`KNN`, `Linear`, `Median`). Generates Before vs After verification reports and cleaned LAS 2.0 / CSV text files.
* **Anomaly Fix Application & Audit Endpoint ([`apply-fixes/route.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/api/las/apply-fixes/route.ts))** *(NEW — Sprint 5)*: REST API endpoint applying approved anomaly fixes to LAS datasets while logging individual, transparent audit entries per anomaly to `ActivityLog`.
* **AI Recommendation Engine ([`ai-analyzer.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/ai-analyzer.ts))**: Rule-based expert system generating natural-language petrophysical risk summaries, confidence scores, and remediation steps.
* **Mnemonic Standardiser ([`standardiser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/standardiser.ts))**: Maps raw vendor mnemonics (`GAMMA`, `DEN`, `CNL`, `ILD`, `AC`) to standard API mnemonics (`GR`, `RHOB`, `NPHI`, `RT`, `DT`) with confidence weighting, custom alias persistence, and `updateActiveUploadWithNewAlias()` auto-propagation.
* **Missing Value & Imputation Engine ([`imputation-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/imputation-engine.ts))**: Diagnoses 4 root causes (casing shoe, washout, telemetry dropout, off-bottom) and benchmarks 5 imputation algorithms (KNN, Cubic Spline, Linear, Mean, Median) with ground-truth cross-validation calculating RMSE, MAE, R², variance preservation, and speed.
* **Cleaned LAS & Report Exporter ([`exporter.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/exporter.ts))**: Generates standard LAS 2.0 text exports with duplicate depth removal, plus CSV, Excel, and PDF certificates.

### 2. Paystack Payment & Monetization System (`src/lib/paystack.ts`)
* **Payment Gateway**: Integration with Paystack supporting Nigerian Naira (₦ NGN) and US Dollars ($ USD) via Cards (Verve, Mastercard, Visa), Direct Bank Transfers, and USSD.
* **API Endpoints**: `/api/paystack/initialize`, `/api/paystack/verify`, `/api/paystack/webhook`, `/api/checkout`, `/api/auth/demo`, and `/api/las/check`.
* **In-Modal Demo Payment Runner (`payment-modal.tsx`)**: In-modal checkout with simulated sandbox progress steps, 1-click test login, instant session upgrade to Pro, and live reference verification without external redirects.
* **Pricing Portal (`/pricing`)**: Full public pricing page comparing Starter Free (2 checks), Pro Petrophysicist (₦75,000/mo or $50/mo), and Enterprise Hub.

### 3. Application UI & Dashboard Modules (`src/app/`)
* **Navigation & Shell**: `app-shell.tsx`, responsive `sidebar.tsx` with mobile drawer, and `header.tsx` with RBAC role switcher (`ADMIN`, `PETROPHYSICIST`, `DATA_ENGINEER`, `GEOSCIENTIST`, `VIEWER`), plus **Global Live Search Bar** featuring real-time matching overlay dropdown, keyboard navigation (`Enter` / `Escape`), and URL search parameter synchronization (`/wells?search=...`).
* **Upload Workspace ([`upload/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/upload/page.tsx))**: Strict "Detect and Flag Only" stage — original raw LAS file remains untouched. Features the 11 Anomaly Audit Checks Grid, 4 Summary Metric Cards, Untouched Raw Multi-Track Viewer with **logarithmic resistivity scale ($0.2\text{--}2000\ \Omega\cdot\text{m}$)** and linear gamma/sonic tracks, and direct CTAs to `/reports` and `/qa-engine`.
* **Quality Engine Page ([`qa-engine/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/qa-engine/page.tsx))** *(REDESIGNED — Sprint 5)*: Comprehensive top-to-bottom layout:
  1. App Sidebar with active "Quality engine" highlight.
  2. Header row with title, `"Apply approved fixes"`, `"Export audit log"`, and `"Download cleaned LAS"`.
  3. Active Wells Dropdown (Upload Workspace, Committed DB Wells, Reference Logs) with confirmation modal protecting unapplied approvals.
  4. Four Live Derived Stat Cards (`Total`, `Critical`, `Warning`, `Approved`).
  5. Type-Isolated Bulk Action Bar (automatically grays out differing anomaly types to enforce mathematical consistency).
  6. Anomaly list with in-place accordion approvals, radio options (recommended pre-selected), and immediate rejection.
  7. 3-Track Cleaned Log Viewer with Compare-to-Raw overlay.
* **Audit Reports Page ([`reports/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/reports/page.tsx))**: Clear demarcation into **1. Anomaly Document** (PDF QA/QC Audit Certificate and Excel Anomaly Findings Sheet) and **2. Cleaned Document** (Cleaned LAS 2.0, Cleaned CSV, Cleaned Curves Excel), supporting direct download of verified cleaned LAS files produced in Quality Engine.
* **Quality Control Command Center (`dashboard/page.tsx`)**: 8 live telemetry KPI cards, 7-day rolling quality trend chart, field performance breakdown, and problem wells list.
* **Asset & Well Management ([`wells/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/page.tsx), [`wells/[id]/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/%5Bid%5D/page.tsx))**: Well inventories, geographic coordinates, curve channels, audit history, **`CurveInventoryTable` component**, and **URL-based search query filtering**.
* **Jest & RTL Automated Test Suite**: 6 passing test suites (`parser.test.ts`, `quality-engine.test.ts`, `cleaner.test.ts`, `header.test.tsx`, `log-viewer.test.tsx`, `cleaned-log-viewer.test.tsx`), 16/16 tests green, and zero TypeScript compilation errors.
* **Specialized Pages**: Standardisation Dictionary (`standardisation/page.tsx`), Analytics (`analytics/page.tsx`), Well Comparison (`comparison/page.tsx`), Activity Log (`activity/page.tsx`), and Admin Panel (`admin/page.tsx`).

### 4. Reusable Well-Log Components (`src/components/well-log/`)
* **Multi-Track Log Viewer ([`log-viewer.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-viewer.tsx))**: Interactive borehole wireline log visualizer featuring a 3-way layout switcher (Log Plot `GRAPH`, Split View `SPLIT`, and Data Table `TABLE`), Classic Paper and Dark Subsurface themes, interactive vertical zoom (0.6× to 3.0×), synchronized depth selection, and printable logs. **Resistivity curves strictly render on a 4-decade logarithmic scale ($0.2\text{--}2000\ \Omega\cdot\text{m}$)** with logarithmic decade gridlines, while Gamma Ray ($0\text{--}150\ \text{GAPI}$) and Sonic ($40\text{--}240\ \mu\text{s/ft}$) render on linear scales.
* **3-Track Cleaned Log Viewer ([`cleaned-log-viewer.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/cleaned-log-viewer.tsx))** *(NEW — Sprint 5)*: Dedicated wireline log visualizer for Quality Engine featuring dynamic Track 1, Track 2, and Track 3 selectors populated from all raw LAS curves, classic borehole header box (Log Code, Field, Depth Range, Operator, Scale), logarithmic resistivity scaling, and a synchronized **"Compare to raw (pre-clean)"** overlay drawing solid cleaned curves on top of dashed muted gray pre-cleaning traces.
* **Interactive Well Log Data Table ([`log-data-table.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-data-table.tsx))**: Numerical borehole spreadsheet displaying depth intervals and all curve channels with standardized mnemonic headers, configurable pagination (50/100/250 rows), instant "Jump to Depth" navigation with row highlighting, granular filtering (All, Anomalies Only, Nulls Only), NULL badges, severity-coded anomaly tags, and direct CSV export.
* **Curve Inventory Table ([`curve-inventory-table.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/curve-inventory-table.tsx))**: Reusable component displaying Raw Mnemonic → Standard Name mapping, Unit, Null %, Data Range, Health Score (colour-coded), and expandable anomaly flag details per curve. Used in both the Upload Workspace and Well Detail pages.
* **Imputation Benchmark Modal (`imputation-benchmark-modal.tsx`)**: Multi-method algorithm comparison UI.

### 5. Database & Infrastructure (`prisma/`)
* **Database**: Neon PostgreSQL on AWS us-east-1 with connection pooling.
* **Schema (`schema.prisma`)**: Models for `User`, `Well`, `LASFile`, `Curve`, `QualityReport`, `Anomaly`, `ActivityLog`, `APIToken`, `Field`, `Operator`.
* **Multi-Tenant Isolation**: Enforced via `ownerId` foreign key and query filters across all API routes.
* **API Type Contracts ([`api-types.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/api-types.ts))**: `WellListItem` and `WellDetailResponse` now include the optional `curveSummaries: CurveHealthSummary[]` field, populated by `extractCurveSummaries()` in the `/api/wells/[id]` route.

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
* **Theme:** Paystack payment integration for Nigeria & global markets, freemium limit enforcement, User Profile & Billing management, activity audit trail, multi-tenant security audit, **upload session persistence**, **curve inventory display in Well Management**, and **enhanced export reports**.

#### ✅ Completed Sprint 5 Deliverables

**SE1 & SE2 — Curve Inventory Display in Well Management** *(Completed 04 Sep 2026)*
* Built reusable [`CurveInventoryTable`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/curve-inventory-table.tsx) component (`src/components/well-log/curve-inventory-table.tsx`) displaying a full per-curve quality matrix: Raw Mnemonic, Standard Name (confidence-matched), Unit, Null %, Data Range (Min–Max), Health Score (colour-coded ≥90 emerald / ≥75 cyan / ≥50 amber / <50 rose), and expandable anomaly flag details.
* Integrated `CurveInventoryTable` into [`wells/[id]/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/%5Bid%5D/page.tsx) — the curve inventory is rendered below the wireline log viewer whenever `curveSummaries` are present, and also shown standalone when no log viewer data is available (e.g., curves stored in DB without raw depth arrays).
* Extended [`api-types.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/api-types.ts) — added `curveSummaries?: CurveHealthSummary[]` to `WellListItem` and `curveSummaries: CurveHealthSummary[]` to `WellDetailResponse`.
* Extended [`/api/wells/[id]/route.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/api/wells/%5Bid%5D/route.ts) — implemented `extractCurveSummaries()` helper that first reads from `reportJson` (parsed QA JSON blob), then falls back to constructing summaries from `Curve` DB records + `Anomaly` join; returns health-scored `CurveHealthSummary[]` array.

**SE2 — Upload Session localStorage Persistence** *(Completed 04 Sep 2026)*
* Added `localStorage` upload session persistence to [`upload/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/upload/page.tsx) under key `wellqc_upload_session`.
* Session state saved on: file parse, QA analysis completion, and successful database commit.
* Session state restored on: page mount (with user-visible restore banner and dismiss/clear option).
* Persisted fields: filename, quality analysis results, curve summaries, committed well ID; raw LAS text excluded to stay within `localStorage` quota limits.
* `QuotaExceededError` handled gracefully — persistence silently skips on storage-full browsers.

**DA4 — Enhanced PDF & Excel Export Reports** *(Completed 04 Sep 2026)*
* **PDF Report** ([`reports/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/reports/page.tsx)) — Streamlined Executive Petrophysical Certificate:
  - Page 1: Well cover block (expanded to include Country, Lat/Long, Elevation, TD, Depth Unit), Committed LAS Summary (12 properties), AI Petrophysical Summary, and numbered Recommendations list.
  - **7 Core Curve Availability Table**: High-contrast, dark slate/navy table checking availability of all 7 critical logging curves (Gamma Ray `GR`, Bulk Density `RHOB`, Neutron Porosity `NPHI`, Sonic `DT`, Deep Resistivity `RT`, Caliper `CALI`, and Spontaneous Potential `SP`) with S/N, Standard Mnemonic, Found in Well? (`YES`/`NO`), Detected Mnemonic, Unit, and Status (`AVAILABLE`/`MISSING`) with custom emerald and rose badges.
  - Streamlined format: Removed the lengthy Curve Standardisation & Quality Inventory and Quality Anomaly Detail tables from the PDF certificate per reporting requirements.
* **Excel Workbook** — Extended from 2 to 4 sheets:
  - `QA Summary`: Full well metadata (12 fields) + AI summary + numbered recommendations.
  - `Cleaned Curves`: Depth + all standardised curve numeric columns (unchanged).
  - `Curve Inventory` *(new)*: All `CurveHealthSummary` fields as numeric-typed cells for pivot-table analysis.
  - `Anomaly Log` *(new, conditional)*: Full anomaly record per row, only appended when anomalies exist.

**SE2 — Global Header Search & Wells URL Query Synchronization** *(Completed 08 Sep 2026)*
* Built live overlay search popup in [`header.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/ui/header.tsx) that queries and filters well assets across Name, API/UWI Number, Field, Operator, and Basin.
* Implemented quick-click direct navigation (`/wells?highlight=<wellId>`) to expand matched assets and `Enter` key search redirection (`/wells?search=<query>`).
* Updated [`wells/page.tsx`](file:///c:/**SE1 & CE1 — Jest & React Testing Library Automated Test Suite** *(Completed 08 Sep 2026)*
* Installed Jest, `@testing-library/react`, `@testing-library/jest-dom`, and `jest-environment-jsdom`.
* Configured [`jest.config.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/jest.config.ts) for Next.js App Router SWC transformations and `@/*` alias mapping.
* Configured [`jest.setup.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/jest.setup.ts) with DOM matchers and added `npm test` / `npm run test:watch` scripts to `package.json`.
* Created 4 unit test suites (8 tests, 100% passing): `parser.test.ts` (LAS parsing & mnemonics), `quality-engine.test.ts` (scoring & 11 anomaly categories), `cleaner.test.ts` (data repair & verification), and `header.test.tsx` (React Header search UI).

**SE2 & CE2 — Paystack Payment Gateway, In-Modal Sandbox Demo Runner & Freemium Enforcement** *(Completed 10 Sep 2026)*
* Integrated Paystack payment system ([`paystack.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/paystack.ts)) supporting Naira (₦ NGN) and US Dollars ($ USD) with Cards, Direct Bank Transfers, and USSD.
* Built In-Modal **Paystack Demo Payment Runner** ([`payment-modal.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/pricing/payment-modal.tsx)) with animated sandbox progress steps, verified sandbox checkout, and 1-click test login.
* Built endpoints: `/api/paystack/initialize`, `/api/paystack/verify`, `/api/paystack/webhook`, `/api/checkout`, `/api/auth/demo`, and `/api/las/check`.
* Implemented Freemium Enforcement: Enforces 2 free LAS checks on Starter tier, automatically prompting the upgrade modal to Pro Petrophysicist.

**SE1, DA1 & DA2 — Enterprise Quality Engine Core: 11 Anomaly Categories & 7 Core Curves** *(Completed 14 Sep 2026)*
* Upgraded [`quality-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/quality-engine.ts) to audit all 7 Core Required Curves (`GR`, `RHOB`, `NPHI`, `DT`, `RT`, `CALI`, `SP`).
* Added exhaustive detection for all 11 user-specified anomaly categories: `DUPLICATE_DEPTH`, `DEPTH_GAP`, `NULL_CLUSTER`, `IMPOSSIBLE_VALUE`, `OUTLIER_VALUE` ($>4.0\sigma$), `EXTREME_SPIKE` (with calibrated DT sonic cycle-skip sensitivity), `FLATLINE`, `UNIT_MISMATCH`, `NON_STANDARD_MNEMONIC`, `DUPLICATE_CURVE`, and `MISSING_CORE_CURVE`.

**DA1 & SE1 — Standardization Studio: Real-Time Alias Auto-Propagation** *(Completed 14 Sep 2026)*
* Implemented `updateActiveUploadWithNewAlias()` in [`standardiser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/standardiser.ts) which re-analyzes `wellqc_upload_workspace` in `localStorage` and broadcasts `wellqc_alias_updated` window event.
* Linked alias modal in [`standardisation/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/standardisation/page.tsx) so active uploads immediately update curve standardization without needing re-upload.

**SE2 — Upload Page: Strict "Detect and Flag Only" Separation** *(Completed 14 Sep 2026)*
* Redesigned [`upload/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/upload/page.tsx) to strictly detect and flag anomalies only; original raw LAS remains untouched and unmodified.
* Implemented the 11 Anomaly Audit Checks Grid with clear status badges and metric cards.
* Added direct action links: "View Audit Report" (`/reports`) and "Send to Quality Engine for Correction" (`/qa-engine`).

**SE1 & SE2 — Quality Engine Page: Dedicated Correction Stage with Active Wells & Granular Controls** *(Completed 14 Sep 2026)*
* Transformed [`qa-engine/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/qa-engine/page.tsx) into the sole stage for data cleaning and repair.
* Added **Active Wells Dropdown** supporting the Current Upload Session, Committed Database Wells, and Preset Reference Logs.
* Added granular correction switches: Duplicate Depths, Depth Gaps, Missing Value Imputation (`KNN`, `Linear`, `Median`, `None`), Unit Conversions, Physical Clipping, DT Despiking, and Flatlines.
* Displays Before vs After Score Verification (`58% POOR -> 94% EXCELLENT [+36%]`).
* Added direct downloads for **Cleaned LAS 2.0 (`.las`)** and **Cleaned CSV (`.csv`)**, and commit back to database.

**DA4 & SE2 — Audit Reports Page: Demarcation into Anomaly Document & Cleaned Document** *(Completed 14 Sep 2026)*
* Restructured [`reports/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/reports/page.tsx) into two explicit tabs:
  1. **Anomaly Document**: PDF Executive QA/QC Audit Certificate and Excel Anomaly Findings Sheet (`.xlsx`).
  2. **Cleaned Document**: Cleaned LAS 2.0 File (`.las`), Cleaned CSV (`.csv`), and Cleaned Curves Excel (`.xlsx`).
* Extended target well selection to support both the active upload session and database records.

**SE1 & SE2 — Synchronized Well Log Tabular Spreadsheet, Split View & Layout Switcher** *(Completed 18 Sep 2026)*
* Built [`WellLogDataTable`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-data-table.tsx) component (`src/components/well-log/log-data-table.tsx`) delivering an interactive numerical borehole spreadsheet with standardised curve headers (`standardiseMnemonic`), multi-page pagination (50/100/250 rows), instant "Jump to Depth" numerical navigation with visual row highlighting, sample counter, and client-side CSV table export.
* Implemented granular table filtering modes: "All Samples", "Anomalies Only" (filters table to depth intervals containing detected anomalies), and "Nulls Only" (filters table to depths where curve sensors experienced nulls or sentinel values).
* Upgraded [`WellLogViewer`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-viewer.tsx) with a dynamic 3-way Layout Switcher:
  1. **Log Plot (`GRAPH`)**: Full-screen multi-track graphical wireline plot with Track 1 (`GR`/`SP`/`CALI`), Track 2 (`RT` logarithmic scale), and Track 3 (`DT`/`RHOB`/`NPHI`).
  2. **Split View (`SPLIT`)**: Side-by-side synchronized view with Wireline curves SVG on the left and `WellLogDataTable` on the right, enabling simultaneous visual curve inspection and depth-correlated numerical auditing with bidirectional depth selection (`onDepthSelect`).
  3. **Data Table (`TABLE`)**: Full numerical spreadsheet mode.
* Retained Classic Borehole Paper Log (`CLASSIC_PAPER`) and Dark Subsurface (`DARK_MODERN`) styling, vertical scale zoom controls (0.6× to 3.0×), and print log functionality.
* Created automated Jest & RTL test suite in [`src/components/__tests__/log-viewer.test.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/__tests__/log-viewer.test.tsx) testing `WellLogDataTable` rendering, sample count, NULL badges, Jump to Depth handler, Nulls Only filter, and `WellLogViewer` layout toggling (bringing the test suite to 5 suites, 12/12 passing tests).

**SE1 & SE2 — Logarithmic Resistivity Scaling & Linear Acoustic/Gamma Scaling** *(Completed 19 Sep 2026)*
* Updated `mapValueToX` in [`log-viewer.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-viewer.tsx) to strictly enforce **logarithmic scaling ($0.2\text{ to }2000\ \Omega\cdot\text{m}$)** for Resistivity curves (`RT`, `RES`, `ILD`, `LLD`, `LLS`) using $X = \frac{\log_{10}(\text{val}) - \log_{10}(\text{min})}{\log_{10}(\text{max}) - \log_{10}(\text{min})} \times \text{trackWidth}$, with vertical decade grid lines and decade scale markers ($0.2, 2, 20, 200, 2000\ \Omega\cdot\text{m}$) in both Classic Paper and Modern Dark views.
* Preserved strict **linear scaling** for Gamma Ray ($0\text{ to }150\ \text{GAPI}$) and Sonic logs ($40\text{ to }240\ \mu\text{s/ft}$).
* Applied seamlessly to the LAS Upload & QA page ([`upload/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/upload/page.tsx)) and borehole log visualizers across the platform.

**SE1 & SE2 — Quality Engine Layout Redesign & Workflow Overhaul** *(Completed 19 Sep 2026)*
* Restructured [`qa-engine/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/qa-engine/page.tsx) into the exact user-specified top-to-bottom layout:
  1. Sidebar navigation with active Quality Engine highlight.
  2. Header row with title + three buttons: `"Apply approved fixes"`, `"Export audit log"`, and `"Download cleaned LAS"`.
  3. Active Wells Dropdown (Upload Session, Reference Wells, Committed DB Wells) with confirmation modal protecting unapplied approvals.
  4. Four Live Derived Stat Cards (`Total`, `Critical`, `Warning`, `Approved`) recalculated instantly on any state change without extra network fetches.
  5. **Type-Isolated Bulk Action Bar**: Checking an anomaly dynamically disables and grays out checkboxes for all differing anomaly types, preventing invalid cross-type operations while enabling one-click bulk approval.
  6. Anomaly list with **in-place accordion** for `"Approve fix"` (radio list of options with recommended default, `"Confirm & apply"`, and `"Cancel"`), immediate `"Reject"` (marking status rejected without prompting), and zero auto-applying behavior.
  7. 3-Track Cleaned Log Viewer embedded at the bottom.

**SE1 & DA4 — Individual Anomaly Audit Logging & Cleaned LAS Export Integration** *(Completed 19 Sep 2026)*
* Created [`anomaly-options.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/anomaly-options.ts) providing petrophysical correction options for all 11 anomaly categories with recommended flags.
* Built API endpoint [`/api/las/apply-fixes`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/api/las/apply-fixes/route.ts) that applies approved fixes to LAS data and records individual `ActivityLog` audit entries per anomaly.
* Enabled `"Export audit log"` on the Quality Engine page downloading a full CSV history of all approve/reject/apply actions.
* Integrated `"Download cleaned LAS"` on both Quality Engine and Audit Reports ([`reports/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/reports/page.tsx)) pages, ensuring verified post-correction LAS files are immediately available upon applying fixes.

**SE1 & SE2 — 3-Track Cleaned Log Viewer with Compare-to-Raw Overlay** *(Completed 19 Sep 2026)*
* Built [`CleanedLogViewer`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/cleaned-log-viewer.tsx) (`src/components/well-log/cleaned-log-viewer.tsx`) featuring:
  - Header bar with view mode toggle (`Classic Paper` vs `Modern Dark`), zoom controls (out, in, reset), and print button.
  - Control bar with Track 1, Track 2, and Track 3 dropdown selectors dynamically populated from all curves in the raw LAS file (`~C` section).
  - **"Compare to raw (pre-clean)"** checkbox overlaying solid colored cleaned curves on top of dashed muted gray pre-cleaning baseline traces across all 3 tracks.
  - Wireline header box (Log Code `ISS 102`, Field, Depth Range, Operator, Scale).
  - Strict logarithmic resistivity scaling and linear acoustic/gamma scaling.

**SE1 & CE1 — Automated Test Suite Expansion & Production Build Verification** *(Completed 19 Sep 2026)*
* Created [`cleaned-log-viewer.test.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/__tests__/cleaned-log-viewer.test.tsx) testing 3-track rendering, logarithmic resistivity scaling, compare-to-raw toggling, and anomaly options recommendations.
* Extended [`log-viewer.test.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/__tests__/log-viewer.test.tsx) with logarithmic scale assertions.
* Full test suite verification: **6 test suites passing, 16/16 tests green (100% pass rate)**.
* Executed full Next.js production build (`npm run build`) with zero compiler or type errors across all 39 static and dynamic routes.

#### 🔄 Remaining Sprint 5 Items

* **CE1:** Execute final load testing for concurrent LAS uploads; verify Vercel serverless function timeouts.
* **CE2:** Final verification of multi-tenant row-level access control across production database seeds before Sprint 6 deployment.
* **SE1 & SE2:** Complete final UI polish across mobile/tablet viewports and verify Paystack live keys configuration.

---

### 🟣 SPRINT 6 (Weeks 11–12): Production Deployment, Demo & Launch
* **Theme:** Production release, demo dataset seeding, documentation sign-off, and stakeholder presentation.
* **SE1:** Conduct final code review of parser, quality engine, standardiser, cleaner, and exporter; ensure zero TypeScript compiler warnings or errors (`npm run build`).
* **SE2:** Final UI polish (animations, loading skeletons, responsive checks on 375px mobile, 768px tablet, 1440px desktop); verify Paystack webhook live endpoints.
* **DA1:** Sign off on standardisation dictionary, curve alias mappings, and physical boundaries.
* **DA2:** Prepare petrophysical root-cause diagnostics and KNN imputation benchmarking slides for stakeholder demo.
* **DA3:** Finalize problem wells and field performance presentation metrics.
* **DA4:** Seed 6 pre-validated Niger Delta demo LAS files (1 EXCELLENT, 2 GOOD, 2 POOR, 1 CRITICAL) for demonstration; validate multi-page PDF export and Excel workbook (4 sheets) against all demo files.
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
│    ├─ S5: Cleaner Engine & 11 Anomaly Audit     └─ S6: Code Review & Build Sign-Off
│
├── 🧑‍💻 SE2 (Full-Stack UI & API Lead)
│    ├─ S1: Next.js Setup & Directory Scaffold    ├─ S2: Landing Page, Auth Pages & Shell
│    ├─ S3: Upload UI & Well CRUD Pages           ├─ S4: Dashboard, QA Engine & Benchmark UI
│    ├─ S5: Paystack + Upload Separation +        └─ S6: UI Polish & Responsive Audit
│           Quality Engine Active Wells & Controls
│
├── 📊 DA1 (Petrophysical Rules & Standardisation Lead)
│    ├─ S1: 8 Core Curve Physical Limit Bounds    ├─ S2: Raw Mnemonic Alias Dictionary
│    ├─ S3: Standardiser Confidence Weighting     ├─ S4: Persistent Custom Alias Feature
│    ├─ S5: Real-Time Alias Auto-Propagation      └─ S6: Petrophysical Dictionary Sign-Off
│
├── 📊 DA2 (Missing Value & Imputation Lead)
│    ├─ S1: Root Cause Diagnostics Definition     ├─ S2: Baseline Imputation Benchmarks
│    ├─ S3: Spike & Flatline Threshold Tuning     ├─ S4: Multi-Method KNN Benchmark Engine
│    ├─ S5: 11 Anomaly Diagnostic Specifications  └─ S6: Imputation Presentation & Slides
│
├── 📊 DA3 (Basin Intelligence & Field Analytics Lead)
│    ├─ S1: Dashboard KPI & Telemetry Specs       ├─ S2: Niger Delta Basin Field Directory
│    ├─ S3: Header Metadata Auto-Extraction       ├─ S4: Analytics & Field Ranking Logic
│    ├─ S5: 7-Day Trend Telemetry Validation      └─ S6: Field Performance Demo Dataset
│
├── 📊 DA4 (Reporting & Quality Audit Lead)
│    ├─ S1: PDF Audit Certificate Layout Specs    ├─ S2: 10 Niger Delta Test LAS Dataset
│    ├─ S3: Quality Grade Range Verification      ├─ S4: PDF / Excel / CSV Exporters
│    ├─ S5: Anomaly vs Cleaned Document Split     └─ S6: Demo Dataset Seeding & Sign-Off
│
├── ☁️ CE1 (DevOps, CI/CD & Performance Lead)
│    ├─ S1: Vercel Project & Environment Setup    ├─ S2: SSL HTTPS & GitHub Actions CI/CD
│    ├─ S3: Next.js Chunk Splitting Optimization  ├─ S4: SVG Rendering Performance Tuning
│    ├─ S5: Automated Jest Test Pipeline          └─ S6: Production Release & Custom Domain
│
└── ☁️ CE2 (Database, Security & Microservice Lead)
     ├─ S1: Neon PostgreSQL DB Provisioning       ├─ S2: Full Prisma Schema & Owner Indexes
     ├─ S3: Atomic Multi-Tenant DB Transaction    ├─ S4: Python FastAPI Imputation Service
     ├─ S5: Freemium Checks & Security Audit      └─ S6: Production DB Migration & Deploy
```

---

## 📋 5. Sprint 5 Delivery Log

| # | Feature | Owner | Status | Date Completed | Files Changed |
|---|---|---|---|---|---|
| 5.1 | `CurveInventoryTable` reusable component | SE1 | ✅ Done | 04 Sep 2026 | `curve-inventory-table.tsx` [NEW] |
| 5.2 | `curveSummaries` API field in `WellListItem` & `WellDetailResponse` | SE1 | ✅ Done | 04 Sep 2026 | `api-types.ts` |
| 5.3 | `extractCurveSummaries()` in `/api/wells/[id]` route | SE1 | ✅ Done | 04 Sep 2026 | `api/wells/[id]/route.ts` |
| 5.4 | `CurveInventoryTable` integration in Well Detail page | SE2 | ✅ Done | 04 Sep 2026 | `wells/[id]/page.tsx` |
| 5.5 | `localStorage` upload session persistence (`wellqc_upload_workspace`) | SE2 | ✅ Done | 04 Sep 2026 | `upload/page.tsx` |
| 5.6 | PDF report — 7 Core Curve Availability table (Gamma Ray, Bulk Density, etc.) | DA4 | ✅ Done | 04 Sep 2026 | `reports/page.tsx` |
| 5.7 | PDF report — Removed verbose curve inventory and anomaly detail tables | DA4 | ✅ Done | 04 Sep 2026 | `reports/page.tsx` |
| 5.8 | PDF report — Expanded well metadata (Country, Lat/Long, Elevation, TD) | DA4 | ✅ Done | 04 Sep 2026 | `reports/page.tsx` |
| 5.9 | Excel workbook — `Curve Inventory` sheet (new, 3rd sheet) | DA4 | ✅ Done | 04 Sep 2026 | `reports/page.tsx` |
| 5.10 | Excel workbook — `Anomaly Log` sheet (new, conditional 4th sheet) | DA4 | ✅ Done | 04 Sep 2026 | `reports/page.tsx` |
| 5.11 | Excel workbook — Expanded `QA Summary` with AI summary & recommendations | DA4 | ✅ Done | 04 Sep 2026 | `reports/page.tsx` |
| 5.12 | Paystack Payment Gateway & Pricing Portal | SE2 | ✅ Done | 10 Sep 2026 | `paystack.ts`, `payment-modal.tsx`, `/pricing` |
| 5.13 | In-Modal Paystack Sandbox Demo Runner & Instant Pro Upgrade | SE2 | ✅ Done | 10 Sep 2026 | `payment-modal.tsx`, `/api/auth/demo` |
| 5.14 | Freemium LAS check enforcement (`/api/las/check`) | CE2 | ✅ Done | 10 Sep 2026 | `api/las/check/route.ts` |
| 5.15 | Multi-Tenant Security Audit | CE2 | ✅ Done | 10 Sep 2026 | All `/api/*` routes |
| 5.16 | Global Header Search Bar & URL search sync (`/wells?search=...`) | SE2 | ✅ Done | 08 Sep 2026 | `header.tsx`, `wells/page.tsx` |
| 5.17 | Jest & RTL Automated Test Suite (`jest.config.ts`, `__tests__/*`) | SE1 | ✅ Done | 08 Sep 2026 | `jest.config.ts`, `jest.setup.ts`, `__tests__/*` |
| 5.18 | Automated LAS Data Cleaner Engine, Verification Audit UI & `cleaner.test.ts` | SE1 | ✅ Done | 09 Sep 2026 | `cleaner.ts`, `clean/route.ts`, `cleaner.test.ts` |
| 5.19 | Quality Engine: 11 Anomaly Categories & 7 Core Curves (`SP` included) | SE1 | ✅ Done | 14 Sep 2026 | `quality-engine.ts`, `quality-engine.test.ts` |
| 5.20 | Real-Time Alias Auto-Propagation (`wellqc_alias_updated`) | DA1 | ✅ Done | 14 Sep 2026 | `standardiser.ts`, `standardisation/page.tsx` |
| 5.21 | Upload Page: Strict "Detect and Flag Only" & 11 Anomaly Checks Grid | SE2 | ✅ Done | 14 Sep 2026 | `upload/page.tsx` |
| 5.22 | Dedicated Quality Engine Page: Active Wells, Granular Toggles & Downloads | SE2 | ✅ Done | 14 Sep 2026 | `qa-engine/page.tsx`, `cleaner.ts` |
| 5.23 | Reports Page: Demarcated Anomaly Document & Cleaned Document Tabs | DA4 | ✅ Done | 14 Sep 2026 | `reports/page.tsx` |
| 5.24 | Interactive Well Log Data Table component (`WellLogDataTable`) | SE1 & SE2 | ✅ Done | 18 Sep 2026 | `log-data-table.tsx` [NEW] |
| 5.25 | Log Viewer 3-Way Layout Switcher (Log Plot, Split View, Data Table) & depth sync | SE1 & SE2 | ✅ Done | 18 Sep 2026 | `log-viewer.tsx` |
| 5.26 | Log Viewer & Data Table Jest/RTL Test Suite (5 suites, 12/12 passing) | SE1 | ✅ Done | 18 Sep 2026 | `log-viewer.test.tsx` [NEW] |
| 5.27 | Logarithmic Resistivity Scaling ($0.2\text{--}2000\ \Omega\cdot\text{m}$) & Linear GR/DT | SE1 | ✅ Done | 19 Sep 2026 | `log-viewer.tsx`, `upload/page.tsx` |
| 5.28 | Standard Anomaly Correction Options Dictionary (11 categories) | DA1 & SE1 | ✅ Done | 19 Sep 2026 | `anomaly-options.ts` [NEW] |
| 5.29 | Quality Engine Layout Overhaul: Top-to-Bottom Layout, Derived Stats & Bulk Bar | SE2 | ✅ Done | 19 Sep 2026 | `qa-engine/page.tsx` |
| 5.30 | Anomaly Fix In-Place Accordion & Single-Anomaly Audit Trail API | SE1 & SE2 | ✅ Done | 19 Sep 2026 | `qa-engine/page.tsx`, `apply-fixes/route.ts` [NEW] |
| 5.31 | 3-Track Cleaned Log Viewer with Compare-to-Raw Overlay & Wireline Header | SE1 & SE2 | ✅ Done | 19 Sep 2026 | `cleaned-log-viewer.tsx` [NEW] |
| 5.32 | Cleaned Log Viewer Jest Suite & Cleaned LAS Export across QA Engine & Reports | SE1 & DA4 | ✅ Done | 19 Sep 2026 | `cleaned-log-viewer.test.tsx` [NEW], `reports/page.tsx` |

---

> **WellQC+ v2.8.0-Enterprise** | Master Development Sprint Plan & Ownership Matrix  
> Updated 19 Sep 2026 · Grounded 100% in Codebase · 8 Team Members (2 SE, 4 DA, 2 CE) · 6 Sprints.