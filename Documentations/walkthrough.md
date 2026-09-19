# Walkthrough - WellQC+ AI-Powered Well Log Quality Assurance Platform

We have designed, built, and verified **WellQC+**, an enterprise-grade cloud platform for petrophysical LAS well log validation, curve standardisation, quality scoring, AI anomaly detection, and interactive log curve rendering. Styled after software from SLB, Palantir Foundry, and Microsoft Fabric, it provides full end-to-end petrophysical QA workflows.

## Completed Deliverables

### 1. Enterprise Architecture & Tech Stack
- **Next.js 15 App Router & TypeScript**: Production-ready, fully typed frontend and server architecture with clean modular structure (`src/lib/las/`, `src/components/`, `src/app/`).
- **Tailwind CSS Enterprise Theme**: SLB/Palantir-inspired dark mode layout (`#0b0f17`), glassmorphic panels, glowing telemetry indicators, and petrophysical log grid styles in [globals.css](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/globals.css).
- **Prisma ORM & SQLite Database**: Fully modeled database with 12 entities (`User`, `Well`, `Field`, `Operator`, `LASFile`, `Curve`, `QualityReport`, `Anomaly`, `ActivityLog`, `APIToken`, `Webhook`) defined in [schema.prisma](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/prisma/schema.prisma) and pre-seeded with sample wells across Permian, Gulf of Mexico, and North Sea basins via [seed.ts](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/prisma/seed.ts).

### 2. Built-in LAS 2.0 / 3.0 Parser & Standardisation Engine
- **TypeScript LAS Engine**: [parser.ts](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/parser.ts) parses header sections (`~V`, `~W`, `~C`, `~P`, `~A`), extracting depth arrays, null values, units, and curve matrices.
- **Curve Standardisation Engine**: [standardiser.ts](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/standardiser.ts) maps raw logging mnemonics (e.g., `GAMMA`, `DEN`, `CNL`, `ILD`, `AC`, `HCAL`) to standard API mnemonics (`GR`, `RHOB`, `NPHI`, `RT`, `DT`, `CALI`, `PEF`, `SP`, `MSFL`, `LLS`) with confidence scores and unit mismatch detection.

### 3. Data Quality & AI Analysis Engine
- **Quality Engine Algorithm**: [quality-engine.ts](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/quality-engine.ts) computes Completeness Score, Consistency Score, Overall Score (0–100), Quality Grade (`EXCELLENT`, `GOOD`, `POOR`, `CRITICAL`), and checks for:
  - Missing values & null ratios.
  - Non-monotonic depth sequences & depth gaps.
  - Physical boundary violations (e.g. density RHOB < 1.0 or > 3.2 g/cc, porosity NPHI < -0.05).
  - Extreme Z-score spikes (> 4.5σ).
  - Flatline sensors (> 25 consecutive identical steps).
- **AI Summary Engine**: [ai-analyzer.ts](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/ai-analyzer.ts) generates natural-language interval recommendations.

### 4. Interactive Petrophysical Log Curve Viewer & Numerical Spreadsheet
- **Multi-Track Viewer with 3-Way Layout Switcher**: [log-viewer.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-viewer.tsx) provides a toolbar-controlled layout switcher:
  - **Log Plot (`GRAPH`)**: Graphical multi-track wireline rendering (Track 1 GR/SP/CALI, Track 2 RT logarithmic scale, Track 3 DT/RHOB/NPHI crossover, and anomaly ribbons).
  - **Split View (`SPLIT`)**: Synchronized side-by-side view pairing the wireline curve plot with the numerical spreadsheet for simultaneous visual inspection and depth-correlated numerical auditing.
  - **Data Table (`TABLE`)**: Full numerical spreadsheet view.
  - **Styling & Controls**: Classic Borehole Paper Log (`CLASSIC_PAPER`) and Dark Subsurface (`DARK_MODERN`) themes, vertical scale zoom controls (0.6× to 3.0×), synchronized depth selection, and print functionality.
- **Interactive Numerical Spreadsheet Component**: [log-data-table.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-data-table.tsx) renders depth intervals and all curve channels with standardized mnemonic headers, configurable pagination (50/100/250 rows), instant "Jump to Depth" navigation with row highlighting, granular filtering (All, Anomalies Only, Nulls Only), NULL indicators, anomaly badges, and direct CSV export.

### 5. Enterprise Dashboard & Feature Modules
- **Command Dashboard**: [dashboard/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/dashboard/page.tsx) featuring 8 telemetry cards, 7-day rolling quality trend chart, field performance breakdown, top problem wells, and recent activity feed.
- **Well Management**: [wells/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/page.tsx) & [wells/[id]/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/%5Bid%5D/page.tsx) asset CRUD, filtering, coordinates, and well log detail view.
- **LAS Upload Workspace**: [upload/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/upload/page.tsx) with drag-and-drop, instant metadata extraction, pre-check quality score, sample log loader buttons, and database commit.
- **Curve Standardisation Dictionary**: [standardisation/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/standardisation/page.tsx) alias mapping dictionary & manual override controls.
- **QA Rule Engine Inspector**: [qa-engine/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/qa-engine/page.tsx) threshold tuning & evaluation.
- **Basin Analytics**: [analytics/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/analytics/page.tsx) operator comparison charts & anomaly distribution.
- **Well Comparison**: [comparison/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/comparison/page.tsx) side-by-side log comparison.
- **Reports & Downloads**: [reports/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/reports/page.tsx) PDF executive certificate export, Excel workbook, CSV audit log, and cleaned LAS files.
- **Activity & Audit Trail**: [activity/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/activity/page.tsx) immutable action log.
- **Admin Panel**: [admin/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/admin/page.tsx) RBAC role simulator, API tokens, and webhooks.
- **FastAPI Python Microservice**: [services/python_parser/main.py](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/services/python_parser/main.py) standalone python service script for high-throughput lasio parsing.

### 6. Public Landing Page & Team Showcase
- **Responsive Landing Page**: [page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/page.tsx) featuring Home hero section, About Us, 8-Member Team showcase, Product Services, Transparent Pricing (Starter, Pro, Enterprise), and Contact Us.
- **8-Member Team Structure & Image Placeholders**:
  - Displays cards for all 8 team roles: **2 Software Engineers** (SE-1, SE-2), **4 Data Analysts** (DA-1, DA-2, DA-3, DA-4), and **2 Cloud Engineers** (CE-1, CE-2).
  - Includes explicit avatar image placeholder containers, initials fallback badges, customizable name fields, and role titles for easy member image/name customization.

### 7. Stripe Freemium & Usage Enforcement
- **Database Schema**: Added `tier` (default `"FREE"`), `freeChecksUsed` (default `0`), `stripeCustomerId`, and `stripeSubscriptionId` to `User` model in Neon PostgreSQL.
- **Strict Check Limitation**: `/api/las/check` validates usage limits for free tier users. Upon reaching 2 free checks, returning status `402 Payment Required` with `limitReached: true`.
- **UI Modal & Header Badge**: [upload/page.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/upload/page.tsx) and [header.tsx](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/ui/header.tsx) trigger a prominent **"Free Check Limit Reached (2/2 Used)"** modal blocking further log checks until upgraded to Pro ($49/mo).

## Verification Results

1. **Prisma Database Generation & Neon PostgreSQL Sync**: Executed `prisma db push` successfully, syncing the schema to Neon PostgreSQL with multi-tenant isolation, user tier tracking, and activity logging.
2. **Production Build**: Executed `npm run build` with zero TypeScript errors and generated optimized static and dynamic routes for all 27 application endpoints.

## Relationship Between Standardiser, Quality Engine, and Uploaded LAS Files
The Standardiser, Quality Engine, and LAS Exporter / Database Commit form a sequential, 3-stage data processing pipeline whenever a LAS file is uploaded:

[ Upload Raw LAS File ]
          │
          ▼
1. Standardiser (standardiser.ts)
   └─ Identifies raw mnemonics (e.g., GAM, DEN, AC, ILD) -> Standard mnemonics (GR, RHOB, DT, RT)
   └─ Supplies expected standard units & min/max physical boundaries (e.g. GR: 0–150 GAPI, RHOB: 1.65–2.65 g/cc)
          │
          ▼
2. Quality Engine (quality-engine.ts)
   └─ Queries the Standardiser to get the target curve's physical limits
   └─ Scans all data points for: Impossible Values (out of bounds), Extreme Spikes (>4.0σ), Flatlines, Depth Gaps, Null Clusters
   └─ Calculates overall Quality Score (0–100), Completeness, Consistency & generates Anomaly Reports
          │
          ▼
3. Exporter & Database Commit (exporter.ts / POST /api/las)
   └─ Clips/nulls flagged impossible physical values or extreme spikes
   └─ Standardises curve names in the cleaned file export
   └─ Persists Well, LASFile, Curve, QualityReport, and Anomaly rows to PostgreSQL
