"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ImputationBenchmarkModal } from "@/components/well-log/imputation-benchmark-modal";
import { PaymentModal } from "@/components/pricing/payment-modal";
import { WellLogViewer } from "@/components/well-log/log-viewer";
import { CurveInventoryTable } from "@/components/well-log/curve-inventory-table";
import { parseLASContent, ParsedLAS } from "@/lib/las/parser";
import { analyzeWellLogQuality, QualityAnalysisResult } from "@/lib/las/quality-engine";
import { cleanLASLogData, CleanedLogResult, CleaningOptions } from "@/lib/las/cleaner";
import { SAMPLE_LAS_FILES, SampleLASFile } from "@/lib/sample-las-files";
import { WellListItem, WellDetailResponse } from "@/lib/api-types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  BarChart3,
  Download,
  Database,
  RefreshCw,
  Eye,
  Layers,
  ArrowRight,
  Check,
  FileText,
  Activity,
} from "lucide-react";

// Reference baseline LAS dataset
const sampleBenchmarkLAS: ParsedLAS = {
  version: "2.0",
  wrap: false,
  wellInfo: {
    wellName: "BENCHMARK-WELL-01",
    company: "GEOSCIENCE CORP",
    field: "DEEPWATER BASIN",
    location: "BLOCK-42",
    country: "NIGERIA",
    state: "OFFSHORE",
    apiUwi: "API-42-990-1029",
    serviceCompany: "SLB",
    date: "2026-03-15",
    startDepth: 5000,
    stopDepth: 5500,
    step: 0.5,
    nullValue: -999.25,
    depthUnit: "FT",
  },
  curves: [
    { mnemonic: "DEPT", unit: "FT", code: "1000", description: "DEPTH" },
    { mnemonic: "GR", unit: "GAPI", code: "2000", description: "GAMMA RAY" },
    { mnemonic: "DT", unit: "US/F", code: "3000", description: "SONIC TRANSIT TIME" },
    { mnemonic: "RHOB", unit: "G/CC", code: "4000", description: "BULK DENSITY" },
    { mnemonic: "NPHI", unit: "V/V", code: "5000", description: "NEUTRON POROSITY" },
    { mnemonic: "CALI", unit: "IN", code: "6000", description: "CALIPER" },
    { mnemonic: "SP", unit: "MV", code: "7000", description: "SPONTANEOUS POTENTIAL" },
  ],
  data: {
    depth: Array.from({ length: 100 }, (_, i) => 5000 + i * 0.5),
    curves: {
      DEPT: Array.from({ length: 100 }, (_, i) => 5000 + i * 0.5),
      GR: Array.from({ length: 100 }, (_, i) => 40 + Math.sin(i * 0.2) * 35 + (i % 7 === 0 ? -999.25 : 0)),
      DT: Array.from({ length: 100 }, (_, i) => 70 + Math.cos(i * 0.15) * 20 + (i === 22 ? 165 : 0) + (i < 8 || i % 9 === 0 ? -999.25 : 0)),
      RHOB: Array.from({ length: 100 }, (_, i) => 2.35 + Math.sin(i * 0.1) * 0.3 + (i === 45 ? 5.8 : 0) + (i > 80 && i < 86 ? -999.25 : 0)),
      NPHI: Array.from({ length: 100 }, (_, i) => 0.22 - Math.sin(i * 0.1) * 0.08 + (i > 80 && i < 86 ? -999.25 : 0)),
      CALI: Array.from({ length: 100 }, (_, i) => 8.5 + (i > 80 && i < 86 ? 8.0 : 0.2 * Math.sin(i))),
      SP: Array.from({ length: 100 }, (_, i) => -35 + Math.sin(i * 0.15) * 20 + (i > 80 && i < 86 ? -999.25 : 0)),
    },
  },
  rawHeader: "",
  totalPoints: 100,
};

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function QAEnginePage() {
  // Active Wells selection states
  const [dbWells, setDbWells] = useState<WellListItem[]>([]);
  const [selectedWellKey, setSelectedWellKey] = useState<string>("benchmark-01");
  const [isLoadingWells, setIsLoadingWells] = useState(false);
  const [isLoadingWellData, setIsLoadingWellData] = useState(false);

  // Upload workspace well (if available in localStorage)
  const [uploadWorkspaceLas, setUploadWorkspaceLas] = useState<ParsedLAS | null>(null);
  const [uploadWorkspaceName, setUploadWorkspaceName] = useState<string>("");

  // Current active LAS and analysis
  const [activeLas, setActiveLas] = useState<ParsedLAS>(sampleBenchmarkLAS);
  const [rawQa, setRawQa] = useState<QualityAnalysisResult>(() => analyzeWellLogQuality(sampleBenchmarkLAS));

  // Granular correction toggles
  const [optDuplicateDepths, setOptDuplicateDepths] = useState(true);
  const [optDepthGaps, setOptDepthGaps] = useState(true);
  const [optOutlierClipping, setOptOutlierClipping] = useState(true);
  const [optDespiking, setOptDespiking] = useState(true);
  const [optUnitStandardization, setOptUnitStandardization] = useState(true);
  const [optFlatlineHandling, setOptFlatlineHandling] = useState(true);
  const [imputationStrategy, setImputationStrategy] = useState<"KNN" | "LINEAR" | "MEDIAN" | "NONE">("KNN");

  // Cleaning Result & View states
  const [cleanedResult, setCleanedResult] = useState<CleanedLogResult | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [activeLogView, setActiveLogView] = useState<"raw" | "cleaned">("cleaned");
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isSavingCleanedWell, setIsSavingCleanedWell] = useState(false);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [limitReachedModal, setLimitReachedModal] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // 1. Fetch DB wells & load Upload Workspace from localStorage on mount
  useEffect(() => {
    // Check localStorage for active upload workspace
    try {
      const raw = localStorage.getItem("wellqc_upload_workspace");
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.parsedLAS) {
          setUploadWorkspaceLas(session.parsedLAS);
          setUploadWorkspaceName(session.fileName || session.parsedLAS.wellInfo.wellName || "Upload Session");
          // Default selection to upload workspace if present
          setSelectedWellKey("upload-session");
          setActiveLas(session.parsedLAS);
          const initialQa = session.qaResult || analyzeWellLogQuality(session.parsedLAS);
          setRawQa(initialQa);
        }
      }
    } catch (e) {
      console.warn("Could not load upload workspace:", e);
    }

    // Fetch database wells
    void fetchDatabaseWells();
  }, []);

  const fetchDatabaseWells = async () => {
    setIsLoadingWells(true);
    try {
      const res = await fetch("/api/wells", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDbWells(data.wells || []);
      }
    } catch (e) {
      console.warn("Failed to load DB wells", e);
    } finally {
      setIsLoadingWells(false);
    }
  };

  // 2. Handle switching the active well from dropdown
  const handleSelectWell = async (key: string) => {
    setSelectedWellKey(key);
    setCleanedResult(null);
    setStatusNotification(null);
    setActiveLogView("raw");

    if (key === "upload-session") {
      if (uploadWorkspaceLas) {
        setActiveLas(uploadWorkspaceLas);
        setRawQa(analyzeWellLogQuality(uploadWorkspaceLas));
      }
      return;
    }

    if (key === "benchmark-01") {
      setActiveLas(sampleBenchmarkLAS);
      setRawQa(analyzeWellLogQuality(sampleBenchmarkLAS));
      return;
    }

    // Check sample LAS files
    const sample = SAMPLE_LAS_FILES.find((s) => s.id === key);
    if (sample) {
      try {
        const parsed = parseLASContent(sample.content);
        setActiveLas(parsed);
        setRawQa(analyzeWellLogQuality(parsed));
      } catch (err) {
        console.error("Failed to parse sample LAS:", err);
      }
      return;
    }

    // Check DB wells
    if (key.startsWith("db-")) {
      const wellId = key.replace("db-", "");
      setIsLoadingWellData(true);
      try {
        const res = await fetch(`/api/wells/${wellId}`, { cache: "no-store" });
        if (res.ok) {
          const detail: WellDetailResponse = await res.json();
          const depthArray = detail.curvesData?.depth || [];
          const curvesList =
            detail.curveSummaries?.map((c) => ({
              mnemonic: c.mnemonic,
              unit: c.unit || "",
              code: "0",
              description: c.standardMnemonic || c.mnemonic,
            })) ||
            Object.keys(detail.curvesData?.curves || {}).map((m) => ({
              mnemonic: m,
              unit: "",
              code: "0",
              description: m,
            }));

          const convertedLas: ParsedLAS = {
            version: "2.0",
            wrap: false,
            wellInfo: {
              wellName: detail.well.name,
              company: detail.well.operatorName || "OPERATOR",
              field: detail.well.fieldName || "FIELD",
              location: detail.well.basin || "",
              country: detail.well.country || "",
              state: "",
              apiUwi: detail.well.apiNo || detail.well.id,
              serviceCompany: "",
              date: detail.well.createdAt || new Date().toISOString(),
              startDepth: depthArray[0] || 0,
              stopDepth: depthArray[depthArray.length - 1] || detail.well.tdFt || 0,
              step: depthArray.length > 1 ? Math.abs(depthArray[1] - depthArray[0]) : 0.5,
              nullValue: -999.25,
              depthUnit: detail.well.depthUnit || "FT",
            },
            curves: curvesList,
            data: {
              depth: depthArray,
              curves: detail.curvesData?.curves || {},
            },
            rawHeader: "",
            totalPoints: depthArray.length,
          };

          setActiveLas(convertedLas);
          setRawQa(analyzeWellLogQuality(convertedLas));
        }
      } catch (e) {
        console.error("Failed to fetch well details:", e);
      } finally {
        setIsLoadingWellData(false);
      }
    }
  };

  // 3. Check freemium limits before running heavy operations
  const checkLimit = async () => {
    try {
      const res = await fetch("/api/las/check", { method: "POST" });
      const data = await res.json();
      if (res.status === 402 || data.limitReached) {
        setLimitReachedModal(true);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  // 4. Execute Selected Anomaly Corrections
  const handleExecuteCorrections = async () => {
    const allowed = await checkLimit();
    if (!allowed) return;

    setIsCleaning(true);
    try {
      const options: CleaningOptions = {
        duplicateDepthPruning: optDuplicateDepths,
        depthGapInterpolation: optDepthGaps,
        outlierClipping: optOutlierClipping,
        despiking: optDespiking,
        unitStandardization: optUnitStandardization,
        flatlineHandling: optFlatlineHandling,
        imputationStrategy,
      };

      const result = cleanLASLogData(activeLas, rawQa, options);
      setCleanedResult(result);
      setActiveLogView("cleaned");
      setStatusNotification(
        `Cleaning complete! Quality Score increased by +${result.verificationReport.scoreImprovement}% (from ${result.verificationReport.originalQualityScore}% [${result.verificationReport.originalGrade}] to ${result.verificationReport.cleanedQualityScore}% [${result.verificationReport.cleanedGrade}]).`
      );
    } catch (err) {
      console.error("Error executing corrections:", err);
      setStatusNotification("Error executing cleaning algorithms. Please check console.");
    } finally {
      setIsCleaning(false);
    }
  };

  // 5. Download Cleaned File (LAS 2.0 or CSV)
  const handleDownloadCleaned = (format: "las" | "csv") => {
    if (!cleanedResult) return;
    const wellStem = activeLas.wellInfo.wellName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

    if (format === "las") {
      downloadTextFile(
        `${wellStem}_cleaned_verified.las`,
        cleanedResult.cleanedLasText,
        "application/octet-stream;charset=utf-8"
      );
    } else {
      downloadTextFile(
        `${wellStem}_cleaned_dataset.csv`,
        cleanedResult.cleanedCsvText,
        "text/csv;charset=utf-8"
      );
    }
  };

  // 6. Save Cleaned Well to Database
  const handleSaveCleanedWell = async () => {
    if (!cleanedResult) return;
    setIsSavingCleanedWell(true);
    try {
      const wellStem = activeLas.wellInfo.wellName;
      const response = await fetch("/api/las", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `${wellStem}_CLEANED.las`,
          content: cleanedResult.cleanedLasText,
        }),
      });

      if (response.ok) {
        setStatusNotification(`Cleaned log saved successfully as '${wellStem}_CLEANED' in Well Management!`);
        void fetchDatabaseWells();
      } else {
        const data = await response.json();
        setStatusNotification(data.error || "Failed to commit cleaned log to database.");
      }
    } catch (err) {
      console.error("Failed to commit cleaned log:", err);
      setStatusNotification("Network error saving cleaned log.");
    } finally {
      setIsSavingCleanedWell(false);
    }
  };

  const handleApplyImputation = (updated: ParsedLAS, strategy: string, curve: string) => {
    setActiveLas(updated);
    setRawQa(analyzeWellLogQuality(updated));
    setStatusNotification(`Applied ${strategy} imputation on curve ${curve}. Log updated.`);
  };

  // Count flagged items for each category on active raw log
  const cntDuplicateDepths = rawQa.anomalies.filter((a) => a.anomalyType === "DUPLICATE_DEPTH").length;
  const cntDepthGaps = rawQa.anomalies.filter((a) => a.anomalyType === "DEPTH_GAP").length;
  const cntNullClusters = rawQa.anomalies.filter((a) => a.anomalyType === "NULL_CLUSTER").length;
  const cntImpossible = rawQa.anomalies.filter((a) => a.anomalyType === "IMPOSSIBLE_VALUE").length;
  const cntOutliers = rawQa.anomalies.filter((a) => a.anomalyType === "OUTLIER_VALUE").length;
  const cntSpikes = rawQa.anomalies.filter((a) => a.anomalyType === "EXTREME_SPIKE").length;
  const cntFlatlines = rawQa.anomalies.filter((a) => a.anomalyType === "FLATLINE").length;
  const cntUnitMismatches = rawQa.anomalies.filter((a) => a.anomalyType === "UNIT_MISMATCH").length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-wellqc-panel/60 border border-wellqc-border p-5 rounded-2xl">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Quality Engine — Data Correction &amp; Repair Stage
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Log Data Cleaning &amp; Anomaly Correction Engine
            </h1>
            <p className="text-xs text-wellqc-muted font-mono mt-0.5">
              Select active well, configure targeted petrophysical repair algorithms, verify before/after scores, and export cleaned datasets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-wellqc-card border border-wellqc-border text-cyan-300 hover:text-white font-bold text-xs shadow-sm hover:border-cyan-500/40 transition-all font-mono cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Imputation Benchmark</span>
            </button>
          </div>
        </div>

        {/* Active Well Selection Dropdown Bar */}
        <div className="bg-wellqc-card/80 border border-wellqc-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="active-well-select" className="text-[11px] font-mono font-bold text-slate-300 block mb-1">
                SELECT ACTIVE WELL FOR CLEANING:
              </label>
              <div className="flex items-center space-x-2">
                <select
                  id="active-well-select"
                  value={selectedWellKey}
                  onChange={(e) => void handleSelectWell(e.target.value)}
                  className="w-full max-w-md bg-slate-900 border border-wellqc-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {uploadWorkspaceLas && (
                    <optgroup label="Current Upload Session">
                      <option value="upload-session">
                        📍 {uploadWorkspaceName} ({uploadWorkspaceLas.curves.length} curves, {uploadWorkspaceLas.totalPoints} pts)
                      </option>
                    </optgroup>
                  )}

                  {dbWells.length > 0 && (
                    <optgroup label="Committed Wells (Well Management)">
                      {dbWells.map((w) => (
                        <option key={w.id} value={`db-${w.id}`}>
                          🛢️ {w.name} — {w.fieldName || w.basin || "Offshore"} ({w.qualityScore}% {w.qualityGrade})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup label="Preset Benchmark Wells">
                    <option value="benchmark-01">
                      🔬 BENCHMARK-WELL-01 (Synthetic Washouts &amp; Sonic Cycle Skips)
                    </option>
                    {SAMPLE_LAS_FILES.map((s) => (
                      <option key={s.id} value={s.id}>
                        📄 {s.name} ({s.field} — {s.operator})
                      </option>
                    ))}
                  </optgroup>
                </select>

                <button
                  type="button"
                  onClick={() => void fetchDatabaseWells()}
                  disabled={isLoadingWells}
                  title="Refresh Wells List"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingWells ? "animate-spin text-cyan-400" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Well Status Badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-500 text-[10px] block">DEPTH INTERVAL</span>
              <span className="font-bold text-white">
                {activeLas.wellInfo.startDepth.toFixed(1)} – {activeLas.wellInfo.stopDepth.toFixed(1)} {activeLas.wellInfo.depthUnit}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-500 text-[10px] block">CURVE CHANNELS</span>
              <span className="font-bold text-cyan-300">{activeLas.curves.length} Channels</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">INITIAL RAW GRADE</span>
              <span className={`font-bold ${
                rawQa.overallScore >= 80 ? "text-emerald-400" :
                rawQa.overallScore >= 60 ? "text-cyan-400" :
                rawQa.overallScore >= 40 ? "text-amber-400" : "text-rose-400"
              }`}>
                {rawQa.overallScore}% ({rawQa.qualityGrade})
              </span>
            </div>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusNotification && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 font-mono text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusNotification}</span>
            </div>
            <button
              onClick={() => setStatusNotification(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Granular Anomaly Correction Controls */}
        <div className="bg-wellqc-panel border border-wellqc-border p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-wellqc-border pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2 font-mono">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span>Selectable Anomaly Correction Controls</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle the specific repair algorithms to execute on the active well log.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setOptDuplicateDepths(true);
                  setOptDepthGaps(true);
                  setOptOutlierClipping(true);
                  setOptDespiking(true);
                  setOptUnitStandardization(true);
                  setOptFlatlineHandling(true);
                  setImputationStrategy("KNN");
                }}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => {
                  setOptDuplicateDepths(false);
                  setOptDepthGaps(false);
                  setOptOutlierClipping(false);
                  setOptDespiking(false);
                  setOptUnitStandardization(false);
                  setOptFlatlineHandling(false);
                  setImputationStrategy("NONE");
                }}
                className="text-slate-400 hover:text-slate-300 underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Remove Duplicate Depths */}
            <div
              onClick={() => setOptDuplicateDepths(!optDuplicateDepths)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                optDuplicateDepths
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                  : "bg-wellqc-card border-wellqc-border opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-mono font-bold text-xs text-white">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${optDuplicateDepths ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                    {optDuplicateDepths ? "✓" : ""}
                  </span>
                  <span>Remove Duplicate Depths</span>
                </div>
                {cntDuplicateDepths > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    {cntDuplicateDepths} Flagged
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans leading-relaxed">
                Purges duplicate index rows and guarantees strict monotonic depth progression.
              </p>
            </div>

            {/* 2. Handle Depth Gaps */}
            <div
              onClick={() => setOptDepthGaps(!optDepthGaps)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                optDepthGaps
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                  : "bg-wellqc-card border-wellqc-border opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-mono font-bold text-xs text-white">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${optDepthGaps ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                    {optDepthGaps ? "✓" : ""}
                  </span>
                  <span>Handle Depth Gaps</span>
                </div>
                {cntDepthGaps > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {cntDepthGaps} Gaps
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans leading-relaxed">
                Identifies telemetry skips (&gt;3x step) and aligns depth intervals for interpretation.
              </p>
            </div>

            {/* 3. Missing Value Imputation */}
            <div className="p-4 rounded-xl border bg-wellqc-card border-wellqc-border space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-mono font-bold text-xs text-white">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Missing Value Imputation</span>
                </div>
                {cntNullClusters > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {cntNullClusters} Clusters
                  </span>
                )}
              </div>
              <div className="pt-1">
                <select
                  value={imputationStrategy}
                  onChange={(e) => setImputationStrategy(e.target.value as any)}
                  className="w-full bg-slate-900 border border-wellqc-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="KNN">KNN Multi-Well Regression (5-NN)</option>
                  <option value="LINEAR">Linear Depth Interpolation</option>
                  <option value="MEDIAN">Windowed Median Fill</option>
                  <option value="NONE">Do Not Impute (Keep Nulls)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Evidence-based ML repair for borehole washouts and missing telemetry intervals.
              </p>
            </div>

            {/* 4. Correct Unit Conversions */}
            <div
              onClick={() => setOptUnitStandardization(!optUnitStandardization)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                optUnitStandardization
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                  : "bg-wellqc-card border-wellqc-border opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-mono font-bold text-xs text-white">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${optUnitStandardization ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                    {optUnitStandardization ? "✓" : ""}
                  </span>
                  <span>Correct Unit Conversions</span>
                </div>
                {cntUnitMismatches > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    {cntUnitMismatches} Mismatched
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans leading-relaxed">
                Standardizes units (e.g. m &rarr; ft, API &rarr; GAPI, decimal &rarr; percentage).
              </p>
            </div>

            {/* 5. Clip Physically Impossible Values */}
            <div
              onClick={() => setOptOutlierClipping(!optOutlierClipping)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                optOutlierClipping
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                  : "bg-wellqc-card border-wellqc-border opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-mono font-bold text-xs text-white">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${optOutlierClipping ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                    {optOutlierClipping ? "✓" : ""}
                  </span>
                  <span>Clip Physically Impossible Values</span>
                </div>
                {(cntImpossible > 0 || cntOutliers > 0) && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    {cntImpossible + cntOutliers} Outliers
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans leading-relaxed">
                Clips RHOB outside 1.0–3.2 g/cc, negative NPHI, and unphysical electrical readings.
              </p>
            </div>

            {/* 6. Despike DT (Acoustic Sonic Channels) */}
            <div
              onClick={() => setOptDespiking(!optDespiking)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                optDespiking
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                  : "bg-wellqc-card border-wellqc-border opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-mono font-bold text-xs text-white">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${optDespiking ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                    {optDespiking ? "✓" : ""}
                  </span>
                  <span>Despike DT &amp; Sonic Logs</span>
                </div>
                {cntSpikes > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    {cntSpikes} Spikes
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans leading-relaxed">
                Eliminates acoustic cycle skips and electrical noise using a 5-point median window.
              </p>
            </div>

            {/* 7. Handle Flatlines / Stuck Sensor */}
            <div
              onClick={() => setOptFlatlineHandling(!optFlatlineHandling)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                optFlatlineHandling
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                  : "bg-wellqc-card border-wellqc-border opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-mono font-bold text-xs text-white">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${optFlatlineHandling ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                    {optFlatlineHandling ? "✓" : ""}
                  </span>
                  <span>Handle Flatlines / Stuck Sensors</span>
                </div>
                {cntFlatlines > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {cntFlatlines} Flatlines
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans leading-relaxed">
                Detects stuck sensor intervals (&gt;25 identical steps) and nullifies for safe analysis.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-mono">
              Ready to process <strong className="text-white">{activeLas.curves.length} curves</strong> over{" "}
              <strong className="text-white">{activeLas.totalPoints} depth samples</strong>.
            </div>

            <button
              type="button"
              onClick={() => void handleExecuteCorrections()}
              disabled={isCleaning}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {isCleaning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Data Cleaning Engine...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Selected Anomaly Corrections</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cleaning Verification & Improvement Report Banner */}
        {cleanedResult && (
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/40 p-6 rounded-2xl space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-black text-white font-mono">
                    Quality Engine Verification &amp; Improvement Summary
                  </h3>
                </div>
                <p className="text-xs text-emerald-200/80 font-mono">
                  {cleanedResult.verificationReport.summaryMessage}
                </p>
              </div>

              {/* Score Improvement Badge */}
              <div className="flex items-center space-x-3 font-mono">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Raw Score</span>
                  <span className="text-sm font-bold text-slate-300">
                    {cleanedResult.verificationReport.originalQualityScore}% ({cleanedResult.verificationReport.originalGrade})
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <div className="text-left bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] text-emerald-300 block uppercase font-bold">Verified Cleaned</span>
                  <span className="text-base font-black text-emerald-300">
                    {cleanedResult.verificationReport.cleanedQualityScore}% ({cleanedResult.verificationReport.cleanedGrade})
                    <span className="text-xs text-emerald-400 ml-1">
                      [+{cleanedResult.verificationReport.scoreImprovement}%]
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 block">Outliers Clipped</span>
                <span className="text-base font-black text-cyan-300">
                  {cleanedResult.verificationReport.outliersRemovedCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 block">Spikes Despiked</span>
                <span className="text-base font-black text-cyan-300">
                  {cleanedResult.verificationReport.spikesDespikedCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 block">Units Converted</span>
                <span className="text-base font-black text-cyan-300">
                  {cleanedResult.verificationReport.unitsConvertedCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 block">Duplicates Pruned</span>
                <span className="text-base font-black text-cyan-300">
                  {cleanedResult.verificationReport.duplicateDepthsPrunedCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 block">Nulls Imputed</span>
                <span className="text-base font-black text-emerald-400">
                  {cleanedResult.verificationReport.nullsImputedCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 block">Flatlines Handled</span>
                <span className="text-base font-black text-cyan-300">
                  {cleanedResult.verificationReport.flatlinesHandledCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 block">Depth Gaps</span>
                <span className="text-base font-black text-cyan-300">
                  {cleanedResult.verificationReport.depthGapsInterpolatedCount}
                </span>
              </div>
            </div>

            {/* Cleaned Curve Downloads Section */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30">
              <div className="text-xs font-mono text-slate-300">
                <strong className="text-emerald-400 font-bold">Download Cleaned Versions:</strong> Export production-ready LAS 2.0 or CSV data for your petrophysical models.
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadCleaned("las")}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Cleaned LAS 2.0 (.las)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadCleaned("csv")}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono shadow transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Cleaned CSV (.csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveCleanedWell()}
                  disabled={isSavingCleanedWell}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs font-mono transition-all cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSavingCleanedWell ? "Saving..." : "Commit Cleaned Log to DB"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wireline Viewer Controls (Raw vs Cleaned Log Switcher) */}
        <div className="flex items-center justify-between bg-wellqc-card border border-wellqc-border p-3 rounded-xl font-mono text-xs">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-bold">Multi-Track Viewer Mode:</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setActiveLogView("raw")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeLogView === "raw"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Raw Log ({activeLas.wellInfo.wellName})
            </button>
            <button
              type="button"
              onClick={() => {
                if (!cleanedResult) {
                  void handleExecuteCorrections();
                } else {
                  setActiveLogView("cleaned");
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeLogView === "cleaned"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Cleaned &amp; Repaired Log</span>
            </button>
          </div>
        </div>

        {/* Multi-Track Wireline Viewer */}
        <WellLogViewer
          wellName={
            activeLogView === "cleaned" && cleanedResult
              ? `${cleanedResult.cleanedLas.wellInfo.wellName} (CLEANED & VERIFIED)`
              : `${activeLas.wellInfo.wellName} (RAW UNTOUCHED)`
          }
          depthUnit={activeLas.wellInfo.depthUnit}
          startDepth={activeLas.wellInfo.startDepth}
          stopDepth={activeLas.wellInfo.stopDepth}
          curvesData={activeLogView === "cleaned" && cleanedResult ? cleanedResult.cleanedLas.data : activeLas.data}
          anomalies={activeLogView === "cleaned" && cleanedResult ? cleanedResult.cleanedQa.anomalies : rawQa.anomalies}
        />

        {/* Curve Standardisation & Quality Inventory Table */}
        <CurveInventoryTable
          curveSummaries={activeLogView === "cleaned" && cleanedResult ? cleanedResult.cleanedQa.curveSummaries : rawQa.curveSummaries}
          title={activeLogView === "cleaned" ? "Verified Cleaned Curve Inventory" : "Raw Curve Quality & Anomaly Inventory"}
        />

        {/* Imputation Benchmark Modal */}
        <ImputationBenchmarkModal
          las={activeLas}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onApplyImputation={handleApplyImputation}
        />

        {/* Freemium Limit Reached Modal */}
        {limitReachedModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">
                  Free Check Limit Reached (2/2 Used)
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  You have used your <strong className="text-white">2 free LAS log file checks</strong> on the Starter plan. Upgrade to <strong className="text-emerald-400">Pro Petrophysicist</strong> for unlimited checks and KNN imputation.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLimitReachedModal(false);
                    setPaymentModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all text-center cursor-pointer"
                >
                  Upgrade via Paystack (₦75k / $49)
                </button>
                <button
                  onClick={() => setLimitReachedModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paystack Payment Modal */}
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          defaultPlan="pro_monthly"
        />
      </div>
    </AppShell>
  );
}
