# WellQC+ — UI/UX Design Specification
> **Enterprise AI-Powered Well Log Quality Assurance Platform**  
> Full Design System: Lo-Fi Wireframes → Hi-Fi Mockups

---

## 🎨 Design System

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| Background Primary | `#0a0f1e` | Page background, sidebar |
| Background Secondary | `#0d1428` | Card surfaces, panels |
| Background Elevated | `#1e293b` | Modal, popover backgrounds |
| Accent Emerald | `#10b981` | Primary CTA, active states, success, KPI highlights |
| Accent Cyan | `#06b6d4` | Secondary accents, charts, billing toggle |
| Accent Gold | `#f59e0b` | Warning badges, FREE tier labels |
| Accent Red | `#ef4444` | Critical grade, error states |
| Text Primary | `#ffffff` | Headlines, key values |
| Text Secondary | `#94a3b8` | Descriptions, labels |
| Border Subtle | `rgba(255,255,255,0.08)` | Card borders, dividers |

### Typography
- **Display Font**: Inter (700 Black, 600 SemiBold)
- **Body Font**: Inter (400 Regular, 500 Medium)
- **Mono Font**: JetBrains Mono or `font-mono` for prices, scores, depth values

### Component Language
- **Glassmorphism Cards**: `backdrop-blur-md`, `bg-white/5`, `border border-white/10`, `rounded-2xl`
- **Glow Buttons**: Emerald gradient with `shadow-emerald-500/25`
- **Grade Badges**: Pill-shaped — EXCELLENT (green), GOOD (cyan), POOR (orange), CRITICAL (red)

---

## 📐 Lo-Fi Wireframes

### Sheet 1 — Core Screens (Screens 1–4)

![Lo-Fi Wireframes Sheet 1](file:///C:/Users/Ekwebelam%20C%20Williams/.gemini/antigravity-ide/brain/9f95577c-81da-436e-b046-09f4a8d4cda0/lofi_wireframes_sheet1_1787934785639.jpg)

| Screen | Key Layout Decisions |
|---|---|
| **1. Landing Page** | Sticky nav → Hero (2 CTAs) → 4 Feature Cards → 3 Pricing Plans → Footer |
| **2. Login / Register** | Centered single-column card, email/password, social login, toggle to register |
| **3. Command Dashboard** | Sidebar + Header shell, 4–8 KPI cards row, 2-col charts, well table |
| **4. Upload Workspace** | Left 60% = dropzone + file queue; Right 40% = log viewer + anomaly summary |

---

### Sheet 2 — Specialized Screens (Screens 5–8)

![Lo-Fi Wireframes Sheet 2](file:///C:/Users/Ekwebelam%20C%20Williams/.gemini/antigravity-ide/brain/9f95577c-81da-436e-b046-09f4a8d4cda0/lofi_wireframes_sheet2_1787934818715.jpg)

| Screen | Key Layout Decisions |
|---|---|
| **5. QA Engine Inspector** | Left panel = 4 threshold sliders; Right panel = live anomaly card results; CTA bar at bottom |
| **6. Analytics Page** | 3 stat cards top → 2-col (Donut chart + Horizontal bars) → Full-width trend chart |
| **7. Reports & Export** | Left = well report checklist; Right = PDF certificate preview; 4-button export bar |
| **8. Paystack Modal** | Dark overlay → Centered modal: currency/billing toggles → Plan card → Method icons → Pay CTA |

---

## 🖥️ Hi-Fi Mockups

### Screen 1 — Landing Page

![Hi-Fi Landing Page](file:///C:/Users/Ekwebelam%20C%20Williams/.gemini/antigravity-ide/brain/9f95577c-81da-436e-b046-09f4a8d4cda0/hifi_landing_page_1787934856116.jpg)

**Design Notes:**
- Glassmorphism navbar with blur effect
- Hero headline split-color: white + emerald gradient on "WellQC+"
- Trust badges below CTA: `256-bit SSL • Paystack Secured • Nigeria's #1 Well QC Platform`
- Floating app screenshot as hero visual (right side)
- Currency toggle (NGN / USD) on pricing section
- Paystack, Verve, Visa, Mastercard logos in footer of pricing

---

### Screen 2 — Command Dashboard

![Hi-Fi Command Dashboard](file:///C:/Users/Ekwebelam%20C%20Williams/.gemini/antigravity-ide/brain/9f95577c-81da-436e-b046-09f4a8d4cda0/hifi_dashboard_1787934891820.jpg)

**Design Notes:**
- Dark sidebar with WellQC+ branding and all 10 nav items
- `Upgrade (Paystack)` CTA button glowing at sidebar bottom
- 7 KPI telemetry cards: Total Wells (247), Avg Score (74.2), Critical Wells (12/red badge), LAS Files (1,842), Files This Month (89/PRO badge), Uptime (99.9%), Anomalies (3,241)
- 7-Day Rolling Quality Trend: multi-line area chart with emerald/cyan gradient fills
- Field Performance: horizontal gradient bar chart with Niger Delta fields (Bonny, Forcados, Qua Iboe, Brass, Escravos)
- Problem Wells table: Grade column uses color-coded pill badges

---

### Screen 3 — LAS Upload Workspace + Wireline Log Viewer

![Hi-Fi Upload Workspace](file:///C:/Users/Ekwebelam%20C%20Williams/.gemini/antigravity-ide/brain/9f95577c-81da-436e-b046-09f4a8d4cda0/hifi_upload_and_logviewer_1787934931994.jpg)

**Design Notes:**
- Large dashed-border dropzone with emerald cloud-upload icon
- File queue shows real-time parsing: complete files show `74 — GOOD` quality badge, processing files show progress bar + spinner
- Right panel Wireline Log Viewer: 3 tracks (GR green / RT orange / RHOB-NPHI cyan+purple crossover)
- Missing gap overlay rendered as semi-transparent red band on log viewer
- Anomaly Summary pills: `3 CRITICAL` (red), `7 WARNING` (yellow), `2 FLATLINE` (orange)
- Sticky bottom action bar: `Clear Queue` ghost button + `Commit 2 Wells to Database` glowing CTA

---

### Screen 4 — Paystack Payment Modal + Basin Analytics

![Hi-Fi Payment Modal and Analytics](file:///C:/Users/Ekwebelam%20C%20Williams/.gemini/antigravity-ide/brain/9f95577c-81da-436e-b046-09f4a8d4cda0/hifi_payment_modal_analytics_1787934977247.jpg)

**Left — Paystack Payment Modal:**
- `WellQC+ Payment Portal` emerald pill badge at top
- Currency toggle: `₦ NGN (Naira)` selected (emerald) / `$ USD (Dollar)` unselected
- Billing toggle: `Monthly` (cyan) / `Annual -17%` unselected
- Active Plan card: **Pro Monthly — ₦75,000/month** with 6-item feature checklist in 2 columns
- Payment method row: Cards (Verve/Visa/MC), Bank Transfer, USSD & Mobile — all dark icon cards
- Full-width gradient checkout button: `⚡ Pay ₦75,000 with Paystack →`
- `🔒 Instant activation & 100% money-back guarantee within 14 days` trust text
- Modal uses `createPortal` → `document.body` at `z-[99999]` to float above all elements

**Right — Basin Analytics:**
- 3 top stat cards with large bold numbers
- Donut chart: Anomaly Type Distribution (5 categories with color legend)
- Horizontal bar chart: Field Performance Ranking (Bonny 80, Qua Iboe 78, Forcados 74, Brass 60, Escravos 34)
- Area chart: Quality Trend Over Time with emerald-to-cyan gradient fill

---

## 🗺️ User Flow Map

```
PUBLIC ROUTES                     AUTHENTICATED APP
──────────────                    ─────────────────
Landing Page (/)
    ↓
  Login (/login)  ──────────────→ Dashboard (/dashboard)
  Register (/register)                  ↓
                              ┌─────────────────────┐
                              │ Sidebar Navigation   │
                              ├─────────────────────┤
                              │ Upload (/upload)     │
                              │ Wells (/wells)       │
                              │ QA Engine            │
                              │ Analytics            │
                              │ Reports              │
                              │ Activity             │
                              │ Admin                │
                              │ Pricing & Plans      │
                              └─────────────────────┘
                                        ↓
                              [FREE TIER LIMIT HIT]
                                        ↓
                              Payment Modal (Portal)
                                        ↓
                          Paystack Checkout (external)
                                        ↓
                         /api/paystack/verify → PRO Tier
                                        ↓
                          Dashboard (?payment=success)
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | 375px | Sidebar collapses to bottom tab bar, single-column layout |
| Tablet | 768px | Sidebar becomes icon-only rail, 2-column cards |
| Desktop | 1280px+ | Full sidebar, all panels visible |
| Wide | 1440px+ | Max-width container, increased chart canvas |

---

> **WellQC+ Design System v1.0** | © WilliamsConcepts | Enterprise Petrophysical Analytics Platform
