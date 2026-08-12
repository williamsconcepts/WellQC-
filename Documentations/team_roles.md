# WellQC+ — Team Roles & Responsibilities

> **Enterprise AI-Powered Well Log Quality Assurance Platform**
> Prepared for Stakeholder & Interviewer Presentation

---

## Team Overview

| Role | Count | Core Domain |
|------|-------|-------------|
| 🧑‍💻 Software Engineers | 2 | Platform Architecture, Full-Stack Development, AI Engine |
| 📊 Data Analysts | 4 | Petrophysical Analysis, QA Methodology, Missing Value Research, Reporting & Quality Audit |
| ☁️ Cloud Engineers | 2 | Infrastructure, Deployment, Database, Security, Python Microservice |
| **Total** | **8** | **WellQC+ End-to-End Delivery** |

---

## 🧑‍💻 Software Engineers (2)

### Software Engineer 1 — Full-Stack Platform & Core Engine Lead

**Primary Focus:** Application architecture, LAS parsing engine, quality scoring algorithms, and AI recommendation system.

**Owns these system components:**

| Component | File(s) | Description |
|-----------|---------|-------------|
| LAS Parser Engine | [`parser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/parser.ts) | Parses LAS 2.0/3.0 files — `~Version`, `~Well`, `~Curve`, `~ASCII` sections, depth arrays, null indicators |
| Quality Scoring Engine | [`quality-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/quality-engine.ts) | Computes Curve Health Scores, Completeness Score, Consistency Score, and Overall Quality Score (0–100) |
| AI Recommendation Engine | [`ai-analyzer.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/ai-analyzer.ts) | Natural language risk classification, confidence scoring, and flagged interval recommendations |
| Mnemonic Standardiser | [`standardiser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/standardiser.ts) | Maps raw curve mnemonics (e.g. `GAMMA`, `DEN`, `CNL`) to standard API mnemonics (`GR`, `RHOB`, `NPHI`) |
| LAS Exporter | [`exporter.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/exporter.ts) | Exports cleaned LAS 2.0 files, CSV, Excel workbooks, and PDF audit certificates |
| Wireline Log Viewer | [`log-viewer.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/log-viewer.tsx) | Classic Borehole Log paper-style view (GR/RT/DT tracks with MISSING GAP overlays) and Dark Subsurface view |

**Key responsibilities:**
- Design the petrophysical quality scoring formula:
  $$\text{Overall Score} = (0.50 \times \text{Avg Curve Health}) + (0.30 \times \text{Completeness}) + (0.20 \times \text{Consistency})$$
- Build anomaly detection rules: Z-score spike detection ($>4.5\sigma$), flatline sensors ($>25$ steps), depth gap inspection, physical limit violations
- Maintain TypeScript type safety across the entire codebase
- Lead code reviews and system architecture decisions

---

### Software Engineer 2 — Frontend, UI/UX, API Routes & Responsiveness Lead

**Primary Focus:** React/Next.js components, responsive design, API endpoints, database ORM layer, and user-facing workflows.

**Owns these system components:**

| Component | File(s) | Description |
|-----------|---------|-------------|
| Application Shell & Navigation | [`app-shell.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/layout/app-shell.tsx), [`sidebar.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/ui/sidebar.tsx), [`header.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/ui/header.tsx) | Responsive mobile drawer navigation, RBAC role switcher, notification system |
| LAS Upload Workspace | [`upload/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/upload/page.tsx) | Drag-and-drop LAS uploader, real-time validation results, commit-to-database workflow |
| Dashboard | [`dashboard/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/dashboard/page.tsx) | 8 KPI cards, 7-day rolling quality trend charts, field performance breakdown |
| Well Management | [`wells/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/page.tsx), [`wells/[id]/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/wells/[id]/page.tsx) | Full CRUD asset management with well coordinates, curve inventory, quality history |
| API Routes | [`api/las/route.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/api/las/route.ts), [`api/wells/route.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/api/wells/route.ts), [`api/dashboard/route.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/api) | Next.js REST API handlers for LAS processing, well CRUD, analytics aggregation |
| QA Engine UI | [`qa-engine/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/qa-engine/page.tsx) | Threshold configuration, stakeholder alignment banner, imputation benchmark modal trigger |
| Imputation Benchmark Modal | [`imputation-benchmark-modal.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/components/well-log/imputation-benchmark-modal.tsx) | Interactive benchmark modal with curve selector, root cause diagnostics, KNN metrics table |
| Auth System | [`auth.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/auth.ts), [`login/`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/login), [`register/`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/register) | JWT session management, user registration, login and role-based access control (RBAC) |
| Reports Module | [`reports/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/reports) | PDF certificates, Excel exports, CSV audit logs via jsPDF, XLSX, and PapaParse |

**Key responsibilities:**
- Implement mobile-first responsive layouts (Mobile 375px, Tablet 768px, Desktop 1440px)
- Manage Prisma ORM schema, database migrations (`prisma db push`), and seed scripts
- Build and maintain RESTful API layer connecting the frontend to quality engine
- Ensure RBAC access control across all page modules (Admin, Petrophysicist, Data Engineer, Geoscientist, Viewer)

---

## 📊 Data Analysts (3)

### Data Analyst 1 — Petrophysical Domain Expert & QA Rules Architect

**Primary Focus:** Define the physical boundary rules, petrophysical knowledge base, and curve validation constraints that power the quality engine.

**Owns these system components:**

| Component | Responsibility |
|-----------|---------------|
| Physical Limit Constants | Define valid measurement ranges (e.g. $\text{RHOB} \in [1.00, 3.20]$ g/cc, $\text{NPHI} \in [-0.05, 0.60]$ v/v, $\text{DT} \in [40, 200]\ \mu$s/ft, $\text{GR} \in [0, 300]$ GAPI) |
| Standard Curve Dictionary | Maintain mnemonic alias mapping table in [`standardiser.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/standardiser.ts) — maps `GAMMA`, `DEN`, `CNL`, `ILD`, `AC`, `HCAL` to API standards |
| Quality Scoring Weights | Validate and calibrate scoring formula weights (50% Curve Health, 30% Completeness, 20% Consistency) against real-world Niger Delta well datasets |
| LAS Null Indicator Review | Validate that all standard null representations (`-999.25`, `-9999`, `NaN`) are correctly handled in [`imputation-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/imputation-engine.ts) |

**Key responsibilities:**
- Serve as the subject matter expert for petrophysical data quality standards
- Review AI-generated recommendations for domain accuracy before each stakeholder presentation
- Validate physical boundary limit constants against industry standards (SLB Log Interpretation Charts, API RP 40)
- Annotate real-world LAS files for training and validation benchmarks

---

### Data Analyst 2 — Missing Value Research & Imputation Benchmarking Lead

**Primary Focus:** Researching the root causes of missing values in well logs and owning the evidence-based imputation benchmarking framework.

**Owns these system components:**

| Component | File | Responsibility |
|-----------|------|---------------|
| Missing Value Origin Diagnostics | [`imputation-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/imputation-engine.ts) → `diagnoseMissingValueCauses()` | Classifies causes: Casing Shoe, Borehole Washout, Telemetry Dropout, Off-Bottom Window |
| KNN Imputation Algorithm | [`imputation-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/imputation-engine.ts) → `imputeKNN()` | Maintains K parameter, feature distance logic, and inverse-distance weighting |
| Benchmark Cross-Validation | [`imputation-engine.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/las/imputation-engine.ts) → `benchmarkImputationMethods()` | Validates RMSE, MAE, R² Score, and Variance Ratio for all 5 imputation strategies |
| Drop Threshold Policy | Configuration of listwise deletion threshold (default 2.0%) with justification |

**Key responsibilities:**
- Research and document the geological reasons behind missing values in each log curve (casing shoe depths, washout zones, tool pickup events)
- Run empirical benchmarks comparing KNN, Linear, Median, Spline, and Row Dropping on real Niger Delta LAS files
- Produce written justification reports for the evidence-based imputation recommendations shown to stakeholders
- Continuously refine the benchmarking results and update the recommended strategy per log curve type

---

### Data Analyst 3 — Statistical Analytics & Basin Intelligence Lead

**Primary Focus:** Aggregation analytics, field performance statistics, and basin-wide trend analysis.

**Owns these system components:**

| Component | File | Responsibility |
|-----------|------|---------------|
| Analytics Dashboard | [`analytics/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/analytics/page.tsx) | Operator comparison charts, error frequency & anomaly distribution histograms |
| Well Comparison Module | [`comparison/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/comparison/page.tsx) | Side-by-side QA metric comparison across multiple wells |
| Activity & Audit Trail | [`activity/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/activity/page.tsx) | Immutable audit log review and compliance trail analysis |

**Key responsibilities:**
- Define and track basin-level KPIs (average quality score, error rate by operator, field performance ranking)
- Ensure the 7-day rolling trend charts on the command dashboard accurately represent basin telemetry
- Coordinate with cloud engineers on data pipeline performance and query optimization

---

### Data Analyst 4 — Reporting & Quality Audit Lead

**Primary Focus:** Executive PDF audit certificates, Excel export templates, CSV logging, and test file dataset validation.

**Owns these system components:**

| Component | File | Responsibility |
|-----------|------|---------------|
| Reports & Exports | [`reports/page.tsx`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/app/reports) | Manages PDF certificates, Excel workbooks, and CSV audit log generation |
| Niger Delta LAS Test Dataset | [`prisma/seed.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/prisma/seed.ts) | Validates test uploads against EXCELLENT, GOOD, POOR, and CRITICAL thresholds |

**Key responsibilities:**
- Design executive-level PDF report templates (jsPDF) for stakeholder meetings
- Build Excel and CSV export templates for petrophysical compliance workflows
- Validate quality engine scores across test LAS files

---

## ☁️ Cloud Engineers (2)

### Cloud Engineer 1 — Infrastructure Architecture & Environment Lead

**Primary Focus:** Deployment environment, server configuration, environment variable management, and CI/CD pipeline.

**Owns these system components:**

| Component | File | Responsibility |
|-----------|------|---------------|
| Environment Configuration | [`.env`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/.env) | `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, API keys and environment-specific configuration |
| Next.js Server Configuration | [`next.config.js`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/next.config.js) | Image optimization, CORS headers, build optimization, experimental server actions |
| Vercel Deployment | [`vercel.json`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/vercel.json) | Production deployment configuration, routing rules, and build command overrides |
| Middleware & Route Protection | [`middleware.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/middleware.ts) | Session validation middleware protecting authenticated routes |

**Key responsibilities:**
- Manage production deployment on Vercel (or equivalent cloud provider)
- Configure environment variable encryption and secret management
- Set up CI/CD pipelines for automated builds (`npm run build` → `next build`) and type checking
- Monitor deployment health, uptime, and error logs in production

---

### Cloud Engineer 2 — Database, Security & Microservice Lead

**Primary Focus:** Database schema design, migrations, Prisma ORM management, Python FastAPI microservice, and security.

**Owns these system components:**

| Component | File | Responsibility |
|-----------|------|---------------|
| Database Schema | [`prisma/schema.prisma`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/prisma/schema.prisma) | Well, User, LASFile, QualityReport, ActivityLog table definitions and relations |
| Database Migrations | `prisma db push` | Schema migration, index management, Neon PostgreSQL production database upgrades |
| Seed & Demo Data | [`prisma/seed.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/prisma) | Demo well data seeding for development and stakeholder demos |
| Python FastAPI Microservice | [`services/python_parser/main.py`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/services/python_parser/main.py) | FastAPI server with `lasio`, `pandas`, `numpy`, and `scikit-learn` for high-throughput LAS processing |
| Multi-Tenant Security | [`src/lib/auth.ts`](file:///c:/Users/Ekwebelam%20C%20Williams/Desktop/WellQC+/src/lib/auth.ts) | Strict query isolation by `ownerId`, JWT tokens, session validation |

**Key responsibilities:**
- Design and maintain normalized database schema for Wells, LAS files, quality reports, and audit trails
- Manage Prisma schema migrations and Neon PostgreSQL database pooling
- Deploy and maintain Python FastAPI microservice for batch LAS data processing
- Ensure multi-tenant data isolation across all database queries

---

## 🗂️ Shared Team Responsibilities

| Responsibility | All Team Members |
|----------------|-----------------|
| **Stakeholder Presentations** | Contribute domain expertise and attend review sessions |
| **Code Repository** | Maintain version history in Git, follow GitFlow branching convention |
| **Documentation** | Maintain in-code docstrings, README, and walkthrough documents |
| **Testing** | Validate their respective modules on real-world Niger Delta LAS files |
| **Sprint Reviews** | Present progress, blockers, and next steps every sprint cycle |

---

## 📌 Quick Reference Summary

```
WellQC+ Team (8 Members)
│
├── 🧑‍💻 Software Engineer 1  →  LAS Parser, QA Scoring Engine, AI Analyzer, Log Viewer
├── 🧑‍💻 Software Engineer 2  →  Frontend UI, API Routes, Auth, Database ORM, Mobile Responsiveness
│
├── 📊 Data Analyst 1        →  Petrophysical Rules, Mnemonic Dictionary, Physical Limits
├── 📊 Data Analyst 2        →  Missing Value Research, KNN Benchmarking, Root Cause Diagnostics  
├── 📊 Data Analyst 3        →  Basin Intelligence, Dashboard KPIs, Field Ranking
├── 📊 Data Analyst 4        →  Reporting & Quality Audit, PDF/Excel/CSV Exporters, Test Datasets
│
├── ☁️ Cloud Engineer 1       →  Infrastructure, Deployment (Vercel), CI/CD, Environment Config
└── ☁️ Cloud Engineer 2       →  Database Schema (Prisma), Neon PostgreSQL, Python FastAPI Microservice
```

---

> **WellQC+ v2.4.0-Enterprise** | Niger Delta Subsurface Analytics Platform
> Built with Next.js 15, TypeScript, Prisma ORM, Python FastAPI, and a proprietary Petrophysical QA Engine.
