"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CleanedLogViewer } from "@/components/well-log/cleaned-log-viewer";
import { parseLASContent, ParsedLAS } from "@/lib/las/parser";
import { analyzeWellLogQuality, QualityAnalysisResult } from "@/lib/las/quality-engine";
import { cleanLASLogData, CleanedLogResult } from "@/lib/las/cleaner";
import { getCorrectionOptionsForType, AnomalyOption } from "@/lib/las/anomaly-options";
import { WellListItem } from "@/lib/api-types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Database,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Reference baseline LAS dataset for instant preview
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
    { mnemonic: "RT", unit: "OHMM", code: "4000", description: "DEEP RESISTIVITY" },
    { mnemonic: "DT", unit: "US/F", code: "3000", description: "SONIC TRANSIT TIME" },
    { mnemonic: "RHOB", unit: "G/CC", code: "5000", description: "BULK DENSITY" },
    { mnemonic: "NPHI", unit: "V/V", code: "6000", description: "NEUTRON POROSITY" },
    { mnemonic: "CALI", unit: "IN", code: "7000", description: "CALIPER" },
  ],
  data: {
    depth: Array.from({ length: 100 }, (_, i) => 5000 + i * 0.5),
    curves: {
      DEPT: Array.from({ length: 100 }, (_, i) => 5000 + i * 0.5),
      GR: Array.from({ length: 100 }, (_, i) => 40 + Math.sin(i * 0.2) * 35 + (i % 8 === 0 ? -999.25 : 0)),
      RT: Array.from({ length: 100 }, (_, i) => Math.pow(10, 0.5 + Math.sin(i * 0.15) * 1.5) + (i === 35 ? 3500 : 0)),
      DT: Array.from({ length: 100 }, (_, i) => 70 + Math.cos(i * 0.15) * 20 + (i === 22 ? 180 : 0) + (i < 5 ? -999.25 : 0)),
      RHOB: Array.from({ length: 100 }, (_, i) => 2.35 + Math.sin(i * 0.1) * 0.3 + (i === 50 ? 6.2 : 0)),
      NPHI: Array.from({ length: 100 }, (_, i) => 0.22 - Math.sin(i * 0.1) * 0.08),
      CALI: Array.from({ length: 100 }, (_, i) => 8.5 + 0.3 * Math.sin(i * 0.3)),
    },
  },
  rawHeader: "",
  totalPoints: 100,
};

export interface AnomalyItem {
  id: string;
  curveMnemonic: string;
  depthStart: number;
  depthEnd: number;
  anomalyType: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  description: string;
  suggestedCorrection: string;
  status: "open" | "approved" | "rejected";
  appliedOptionId?: string;
  appliedOptionLabel?: string;
}

interface AuditRecord {
  timestamp: string;
  wellName: string;
  anomalyId: string;
  anomalyType: string;
  curveMnemonic: string;
  depthRange: string;
  action: "APPROVED" | "REJECTED" | "APPLIED";
  optionLabel: string;
  user: string;
}

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

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_\-]/g, "_");
}

export default function QAEnginePage() {
  // Available Wells state
  const [dbWells, setDbWells] = useState<WellListItem[]>([]);
  const [uploadWorkspaceLas, setUploadWorkspaceLas] = useState<ParsedLAS | null>(null);
  const [uploadWorkspaceName, setUploadWorkspaceName] = useState<string>("");

  // Active selected well key
  const [selectedWellKey, setSelectedWellKey] = useState<string>("benchmark-01");
  const [isLoadingWell, setIsLoadingWell] = useState<boolean>(false);

  // Unsaved approvals confirmation modal state
  const [pendingWellSwitchKey, setPendingWellSwitchKey] = useState<string | null>(null);
  const [showSwitchConfirmModal, setShowSwitchConfirmModal] = useState<boolean>(false);

  // Active LAS and Anomalies state
  const [activeLas, setActiveLas] = useState<ParsedLAS>(sampleBenchmarkLAS);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);

  // Accordion expansion and option choices
  const [expandedAnomalyId, setExpandedAnomalyId] = useState<string | null>(null);
  const [selectedOptionMap, setSelectedOptionMap] = useState<Record<string, string>>({});

  // Checkbox & Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOptionId, setBulkOptionId] = useState<string>("");

  // Cleaned LAS and Audit state
  const [cleanedLas, setCleanedLas] = useState<ParsedLAS | null>(null);
  const [cleanedLasText, setCleanedLasText] = useState<string>("");
  const [hasAppliedFixes, setHasAppliedFixes] = useState<boolean>(false);
  const [isApplyingFixes, setIsApplyingFixes] = useState<boolean>(false);
  const [auditLog, setAuditLog] = useState<AuditRecord[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Helper: Build AnomalyItem array from QualityAnalysisResult
  const buildAnomalyItems = useCallback((qa: QualityAnalysisResult): AnomalyItem[] => {
    return qa.anomalies.map((a, idx) => ({
      id: `anom-${idx}-${a.anomalyType}-${a.curveMnemonic}`,
      curveMnemonic: a.curveMnemonic,
      depthStart: a.depthStart,
      depthEnd: a.depthEnd,
      anomalyType: a.anomalyType,
      severity: a.severity,
      description: a.description,
      suggestedCorrection: a.suggestedCorrection,
      status: "open",
    }));
  }, []);

  // 1. Initial Data Loading
  useEffect(() => {
    // Check localStorage for uploaded workspace well
    try {
      const raw = localStorage.getItem("wellqc_upload_workspace");
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.parsedLAS) {
          setUploadWorkspaceLas(session.parsedLAS);
          setUploadWorkspaceName(session.fileName || session.parsedLAS.wellInfo?.wellName || "Active Upload");
          setSelectedWellKey("upload-session");
          setActiveLas(session.parsedLAS);
          const qa = session.qaResult || analyzeWellLogQuality(session.parsedLAS);
          setAnomalies(buildAnomalyItems(qa));
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read upload workspace:", e);
    }

    // Default to benchmark if no upload session
    const initialQa = analyzeWellLogQuality(sampleBenchmarkLAS);
    setAnomalies(buildAnomalyItems(initialQa));

    // Fetch database wells
    async function loadDbWells() {
      try {
        const res = await fetch("/api/wells", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setDbWells(data.wells || []);
        }
      } catch (err) {
        console.warn("Failed to load database wells:", err);
      }
    }
    void loadDbWells();
  }, [buildAnomalyItems]);

  // Derived current well name
  const currentWellName = useMemo(() => {
    if (selectedWellKey === "upload-session") {
      return uploadWorkspaceName || activeLas.wellInfo.wellName || "Upload Session";
    }
    if (selectedWellKey === "benchmark-01") {
      return "BENCHMARK-WELL-01";
    }
    const found = dbWells.find((w) => w.id === selectedWellKey);
    return found?.name || activeLas.wellInfo.wellName || "Selected Well";
  }, [selectedWellKey, uploadWorkspaceName, activeLas, dbWells]);

  // 2. Pure Derived Stat Cards
  // Total = anomalies.length, Critical/Warning = count by severity, Approved = count where status === 'approved'
  const statTotal = anomalies.length;
  const statCritical = anomalies.filter((a) => a.severity === "CRITICAL").length;
  const statWarning = anomalies.filter((a) => a.severity === "WARNING").length;
  const statApproved = anomalies.filter((a) => a.status === "approved").length;

  // 3. Well Selector & Switching with Confirmation
  const switchWellData = useCallback(
    async (targetKey: string) => {
      setIsLoadingWell(true);
      setSelectedWellKey(targetKey);
      setSelectedIds(new Set());
      setExpandedAnomalyId(null);
      setSelectedOptionMap({});
      setCleanedLas(null);
      setCleanedLasText("");
      setHasAppliedFixes(false);

      try {
        if (targetKey === "upload-session" && uploadWorkspaceLas) {
          setActiveLas(uploadWorkspaceLas);
          const qa = analyzeWellLogQuality(uploadWorkspaceLas);
          setAnomalies(buildAnomalyItems(qa));
        } else if (targetKey === "benchmark-01") {
          setActiveLas(sampleBenchmarkLAS);
          const qa = analyzeWellLogQuality(sampleBenchmarkLAS);
          setAnomalies(buildAnomalyItems(qa));
        } else {
          // Fetch database well detail
          const res = await fetch(`/api/wells/${targetKey}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.curvesData) {
              const loadedLas: ParsedLAS = {
                version: "2.0",
                wrap: false,
                wellInfo: {
                  wellName: data.well.name,
                  company: data.well.operatorName,
                  field: data.well.fieldName,
                  location: data.well.basin,
                  country: data.well.country,
                  state: "",
                  apiUwi: data.well.apiNo,
                  serviceCompany: data.well.operatorName,
                  date: new Date().toISOString().split("T")[0],
                  startDepth: data.curvesData.depth[0] || 5000,
                  stopDepth: data.curvesData.depth[data.curvesData.depth.length - 1] || 6000,
                  step: 0.5,
                  nullValue: -999.25,
                  depthUnit: data.well.depthUnit || "FT",
                },
                curves: Object.keys(data.curvesData.curves).map((mnem) => ({
                  mnemonic: mnem,
                  unit: "",
                  code: "",
                  description: mnem,
                })),
                data: data.curvesData,
                rawHeader: "",
                totalPoints: data.curvesData.depth.length,
              };
              setActiveLas(loadedLas);
              const qa = analyzeWellLogQuality(loadedLas);
              setAnomalies(buildAnomalyItems(qa));
            }
          }
        }
      } catch (err) {
        console.error("Failed to switch well:", err);
      } finally {
        setIsLoadingWell(false);
      }
    },
    [uploadWorkspaceLas, buildAnomalyItems],
  );

  const handleWellChangeRequest = (newKey: string) => {
    if (newKey === selectedWellKey) return;

    // Check if there are unsaved approvals on current well
    const hasUnsavedApprovals = anomalies.some((a) => a.status === "approved") && !hasAppliedFixes;
    if (hasUnsavedApprovals) {
      setPendingWellSwitchKey(newKey);
      setShowSwitchConfirmModal(true);
      return;
    }

    void switchWellData(newKey);
  };

  const confirmDiscardAndSwitch = () => {
    if (pendingWellSwitchKey) {
      void switchWellData(pendingWellSwitchKey);
    }
    setPendingWellSwitchKey(null);
    setShowSwitchConfirmModal(false);
  };

  // 4. Anomaly Row In-Place Accordion & Approve Fix
  const handleToggleApproveAccordion = (anomaly: AnomalyItem) => {
    if (expandedAnomalyId === anomaly.id) {
      setExpandedAnomalyId(null);
      return;
    }

    // Pre-select recommended option if none chosen yet
    const options = getCorrectionOptionsForType(anomaly.anomalyType);
    const recommended = options.find((o) => o.recommended) || options[0];
    if (!selectedOptionMap[anomaly.id] && recommended) {
      setSelectedOptionMap((prev) => ({ ...prev, [anomaly.id]: recommended.id }));
    }

    setExpandedAnomalyId(anomaly.id);
  };

  const handleConfirmApprove = (anomaly: AnomalyItem) => {
    const options = getCorrectionOptionsForType(anomaly.anomalyType);
    const chosenOptionId = selectedOptionMap[anomaly.id] || options.find((o) => o.recommended)?.id || options[0]?.id;
    const chosenOption = options.find((o) => o.id === chosenOptionId) || options[0];

    setAnomalies((prev) =>
      prev.map((item) =>
        item.id === anomaly.id
          ? {
              ...item,
              status: "approved",
              appliedOptionId: chosenOption.id,
              appliedOptionLabel: chosenOption.label,
            }
          : item,
      ),
    );

    // Record in local audit record
    setAuditLog((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        wellName: currentWellName,
        anomalyId: anomaly.id,
        anomalyType: anomaly.anomalyType,
        curveMnemonic: anomaly.curveMnemonic,
        depthRange: `${anomaly.depthStart.toFixed(1)} - ${anomaly.depthEnd.toFixed(1)}`,
        action: "APPROVED",
        optionLabel: chosenOption.label,
        user: "Petrophysicist",
      },
    ]);

    setExpandedAnomalyId(null);
  };

  // 5. Clicking "Reject"
  const handleReject = (anomaly: AnomalyItem) => {
    setAnomalies((prev) =>
      prev.map((item) =>
        item.id === anomaly.id
          ? {
              ...item,
              status: "rejected",
              appliedOptionId: undefined,
              appliedOptionLabel: undefined,
            }
          : item,
      ),
    );

    if (expandedAnomalyId === anomaly.id) {
      setExpandedAnomalyId(null);
    }

    // Remove from selection if it was selected
    if (selectedIds.has(anomaly.id)) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(anomaly.id);
        return next;
      });
    }

    setAuditLog((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        wellName: currentWellName,
        anomalyId: anomaly.id,
        anomalyType: anomaly.anomalyType,
        curveMnemonic: anomaly.curveMnemonic,
        depthRange: `${anomaly.depthStart.toFixed(1)} - ${anomaly.depthEnd.toFixed(1)}`,
        action: "REJECTED",
        optionLabel: "Ignored by user (Leave untouched)",
        user: "Petrophysicist",
      },
    ]);
  };

  // 6. Checkbox + Bulk Select with Type-Matching Rule
  const firstSelectedId = useMemo(() => {
    if (selectedIds.size === 0) return null;
    return Array.from(selectedIds)[0];
  }, [selectedIds]);

  const firstSelectedAnomaly = useMemo(() => {
    if (!firstSelectedId) return null;
    return anomalies.find((a) => a.id === firstSelectedId) || null;
  }, [firstSelectedId, anomalies]);

  const firstSelectedType = useMemo(() => {
    return firstSelectedAnomaly?.anomalyType || null;
  }, [firstSelectedAnomaly]);

  // Options for the active bulk type
  const bulkOptions = useMemo(() => {
    if (!firstSelectedType) return [];
    return getCorrectionOptionsForType(firstSelectedType);
  }, [firstSelectedType]);

  // Set default bulk option when a type is first selected
  useEffect(() => {
    if (bulkOptions.length > 0) {
      const rec = bulkOptions.find((o) => o.recommended) || bulkOptions[0];
      setBulkOptionId(rec.id);
    } else {
      setBulkOptionId("");
    }
  }, [bulkOptions]);

  const handleToggleCheckbox = (anomaly: AnomalyItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(anomaly.id)) {
        next.delete(anomaly.id);
      } else {
        // Enforce type-matching: only allow if matches firstSelectedType or first selection
        if (next.size === 0 || anomaly.anomalyType === firstSelectedType) {
          next.add(anomaly.id);
        }
      }
      return next;
    });
  };

  const handleApplyBulk = () => {
    if (selectedIds.size === 0 || !firstSelectedType) return;
    const chosenOption = bulkOptions.find((o) => o.id === bulkOptionId) || bulkOptions[0];
    if (!chosenOption) return;

    setAnomalies((prev) =>
      prev.map((item) => {
        if (selectedIds.has(item.id)) {
          return {
            ...item,
            status: "approved",
            appliedOptionId: chosenOption.id,
            appliedOptionLabel: chosenOption.label,
          };
        }
        return item;
      }),
    );

    // Record bulk audit items
    const timestamp = new Date().toISOString();
    const newRecords: AuditRecord[] = Array.from(selectedIds).map((id) => {
      const anom = anomalies.find((a) => a.id === id);
      return {
        timestamp,
        wellName: currentWellName,
        anomalyId: id,
        anomalyType: anom?.anomalyType || firstSelectedType,
        curveMnemonic: anom?.curveMnemonic || "-",
        depthRange: anom ? `${anom.depthStart.toFixed(1)} - ${anom.depthEnd.toFixed(1)}` : "-",
        action: "APPROVED",
        optionLabel: chosenOption.label,
        user: "Petrophysicist (Bulk Action)",
      };
    });
    setAuditLog((prev) => [...prev, ...newRecords]);

    setSelectedIds(new Set());
  };

  // 7. "Apply Approved Fixes" (Top Button)
  const handleApplyApprovedFixes = async () => {
    const approvedItems = anomalies.filter((a) => a.status === "approved");
    if (approvedItems.length === 0) {
      setNotification("No approved fixes to apply. Click 'Approve fix' on anomalies first.");
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setIsApplyingFixes(true);
    setNotification(null);

    try {
      const payloadFixes = approvedItems.map((a) => {
        const options = getCorrectionOptionsForType(a.anomalyType);
        const opt = options.find((o) => o.id === a.appliedOptionId) || options[0];
        return {
          anomalyId: a.id,
          anomalyType: a.anomalyType,
          curveMnemonic: a.curveMnemonic,
          depthStart: a.depthStart,
          depthEnd: a.depthEnd,
          optionId: opt.id,
          optionLabel: opt.label,
          description: a.description,
        };
      });

      // Send to backend API to persist individual audit logs
      const res = await fetch("/api/las/apply-fixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wellId: selectedWellKey,
          approvedFixes: payloadFixes,
          rawLas: activeLas,
        }),
      });

      const data = await res.json();

      // Run local cleaning engine to obtain verified cleaned LAS
      const approvedTypes = new Set(approvedItems.map((a) => a.anomalyType.toUpperCase()));
      const cleaningResult: CleanedLogResult = cleanLASLogData(activeLas, undefined, {
        duplicateDepthPruning: approvedTypes.has("DUPLICATE_DEPTH"),
        depthGapInterpolation: approvedTypes.has("DEPTH_GAP"),
        despiking: approvedTypes.has("EXTREME_SPIKE"),
        outlierClipping: approvedTypes.has("OUTLIER_VALUE") || approvedTypes.has("IMPOSSIBLE_VALUE"),
        flatlineHandling: approvedTypes.has("FLATLINE"),
        unitStandardization: approvedTypes.has("UNIT_MISMATCH") || approvedTypes.has("NON_STANDARD_MNEMONIC"),
        imputationStrategy: approvedTypes.has("NULL_CLUSTER") ? "KNN" : "NONE",
      });

      const finalCleanedLas = data.cleanedLas || cleaningResult.cleanedLas;
      const finalCleanedLasText = data.cleanedLasText || cleaningResult.cleanedLasText;

      setCleanedLas(finalCleanedLas);
      setCleanedLasText(finalCleanedLasText);
      setHasAppliedFixes(true);

      // Save to localStorage so reports page can download cleaned LAS
      try {
        localStorage.setItem(`wellqc_cleaned_las_${selectedWellKey}`, finalCleanedLasText);
        localStorage.setItem(
          "wellqc_latest_cleaned_las",
          JSON.stringify({
            wellId: selectedWellKey,
            wellName: currentWellName,
            cleanedLasText: finalCleanedLasText,
            cleanedAt: new Date().toISOString(),
          }),
        );
      } catch (e) {
        console.warn("Could not cache cleaned LAS text:", e);
      }

      // Record applied entries in audit log
      const timestamp = new Date().toISOString();
      const appliedAuditEntries: AuditRecord[] = payloadFixes.map((f) => ({
        timestamp,
        wellName: currentWellName,
        anomalyId: f.anomalyId,
        anomalyType: f.anomalyType,
        curveMnemonic: f.curveMnemonic,
        depthRange: `${f.depthStart.toFixed(1)} - ${f.depthEnd.toFixed(1)}`,
        action: "APPLIED",
        optionLabel: f.optionLabel,
        user: "Petrophysicist",
      }));
      setAuditLog((prev) => [...prev, ...appliedAuditEntries]);

      setNotification(`✓ Successfully applied ${approvedItems.length} approved fixes. Cleaned LAS is ready!`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error("Error applying fixes:", err);
      setNotification("Failed to apply approved fixes. Please try again.");
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsApplyingFixes(false);
    }
  };

  // 8. "Export Audit Log"
  const handleExportAuditLog = () => {
    const csvHeader = [
      "Timestamp",
      "Well Name",
      "Anomaly ID",
      "Anomaly Type",
      "Curve Mnemonic",
      "Depth Range",
      "Action",
      "Option Applied",
      "User",
    ].join(",");

    const rows = auditLog.map((log) =>
      [
        `"${log.timestamp}"`,
        `"${log.wellName}"`,
        `"${log.anomalyId}"`,
        `"${log.anomalyType}"`,
        `"${log.curveMnemonic}"`,
        `"${log.depthRange}"`,
        `"${log.action}"`,
        `"${log.optionLabel.replace(/"/g, '""')}"`,
        `"${log.user}"`,
      ].join(","),
    );

    // If auditLog empty, export current snapshot
    if (rows.length === 0) {
      anomalies.forEach((a) => {
        rows.push(
          [
            `"${new Date().toISOString()}"`,
            `"${currentWellName}"`,
            `"${a.id}"`,
            `"${a.anomalyType}"`,
            `"${a.curveMnemonic}"`,
            `"${a.depthStart.toFixed(1)} - ${a.depthEnd.toFixed(1)}"`,
            `"${a.status.toUpperCase()}"`,
            `"${(a.appliedOptionLabel || "None").replace(/"/g, '""')}"`,
            `"Petrophysicist"`,
          ].join(","),
        );
      });
    }

    const csvContent = `${csvHeader}\n${rows.join("\n")}\n`;
    downloadTextFile(
      `${sanitizeFileName(currentWellName)}_Quality_Audit_Log.csv`,
      csvContent,
      "text/csv;charset=utf-8",
    );
  };

  // 9. "Download Cleaned LAS"
  const handleDownloadCleanedLAS = () => {
    if (!cleanedLasText) {
      setNotification("Please click 'Apply approved fixes' first to generate the cleaned LAS file.");
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    downloadTextFile(
      `${sanitizeFileName(currentWellName)}_cleaned.las`,
      cleanedLasText,
      "application/octet-stream;charset=utf-8",
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Status Notification Banner */}
        {notification && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-xl font-mono text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Header Row: Title + Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-wellqc-panel border border-wellqc-border p-5 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Petrophysical Quality Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1 flex items-center space-x-3">
              <span>Quality Engine</span>
              <ShieldCheck className="w-6 h-6 text-cyan-400 inline" />
            </h1>
            <p className="text-xs text-wellqc-muted font-mono mt-0.5">
              Review algorithmic anomalies, approve petrophysical fixes with full audit transparency, and inspect cleaned curves.
            </p>
          </div>

          {/* Top Header Buttons: Apply Approved Fixes, Export Audit Log, Download Cleaned LAS */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Apply Approved Fixes */}
            <button
              onClick={handleApplyApprovedFixes}
              disabled={isApplyingFixes || statApproved === 0}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg ${
                statApproved > 0
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02]"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              }`}
              title={statApproved > 0 ? "Apply all approved corrections to this well log" : "Approve at least one fix to apply"}
            >
              {isApplyingFixes ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Apply approved fixes ({statApproved})</span>
            </button>

            {/* Export Audit Log */}
            <button
              onClick={handleExportAuditLog}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold bg-wellqc-card hover:bg-wellqc-card/80 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 shadow-md transition-all hover:scale-[1.01]"
              title="Download full audit log of all approve/reject/apply actions"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Export audit log</span>
            </button>

            {/* Download Cleaned LAS */}
            <button
              onClick={handleDownloadCleanedLAS}
              disabled={!hasAppliedFixes}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md ${
                hasAppliedFixes
                  ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20 hover:scale-[1.01]"
                  : "bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed"
              }`}
              title={
                hasAppliedFixes
                  ? "Download cleaned LAS file with applied fixes"
                  : "Click 'Apply approved fixes' first to enable download"
              }
            >
              <Download className="w-4 h-4" />
              <span>Download cleaned LAS</span>
            </button>
          </div>
        </div>

        {/* 3. Active Well Dropdown */}
        <div className="bg-wellqc-card border border-wellqc-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs font-mono w-full">
            <span className="text-slate-400 font-bold whitespace-nowrap flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Well:</span>
            </span>
            <select
              value={selectedWellKey}
              onChange={(e) => handleWellChangeRequest(e.target.value)}
              disabled={isLoadingWell}
              className="flex-1 bg-wellqc-panel border border-wellqc-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
            >
              {uploadWorkspaceLas && (
                <optgroup label="Active Ingested Workspace">
                  <option value="upload-session">
                    📍 {uploadWorkspaceName} ({uploadWorkspaceLas.curves.length} curves, {uploadWorkspaceLas.wellInfo.apiUwi || "Session"})
                  </option>
                </optgroup>
              )}

              <optgroup label="Standard Reference Wells">
                <option value="benchmark-01">
                  🧪 BENCHMARK-WELL-01 (API-42-990-1029) — Deepwater Basin
                </option>
              </optgroup>

              {dbWells.length > 0 && (
                <optgroup label="Committed Database Wells">
                  {dbWells.map((w) => (
                    <option key={w.id} value={w.id}>
                      🛢️ {w.name} ({w.apiNo}) — {w.fieldName || "Offshore"}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          {isLoadingWell && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
        </div>

        {/* 4. Four Stat Cards (Pure Derived Values) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Anomalies */}
          <div className="bg-wellqc-panel border border-wellqc-border rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Total Anomalies
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-white font-mono mt-0.5">
                {statTotal}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          {/* Critical */}
          <div className="bg-wellqc-panel border border-wellqc-border rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-bold">
                Critical
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-red-400 font-mono mt-0.5">
                {statCritical}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>

          {/* Warning */}
          <div className="bg-wellqc-panel border border-wellqc-border rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Warning
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-amber-400 font-mono mt-0.5">
                {statWarning}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          {/* Approved */}
          <div className="bg-wellqc-panel border border-wellqc-border rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Approved
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-emerald-400 font-mono mt-0.5">
                {statApproved}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* 5. Bulk Action Bar (Only appears when 1+ anomalies are selected) */}
        {selectedIds.size > 0 && firstSelectedType && (
          <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/50 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-sm font-bold text-cyan-200">
                {selectedIds.size} &apos;{firstSelectedType}&apos; anomal{selectedIds.size === 1 ? "y" : "ies"} selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Action:</span>
                <select
                  value={bulkOptionId}
                  onChange={(e) => setBulkOptionId(e.target.value)}
                  className="bg-wellqc-panel border border-cyan-500/40 text-cyan-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 font-bold max-w-xs md:max-w-md"
                >
                  {bulkOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} {opt.recommended ? "(Recommended)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply to N selected */}
              <button
                onClick={handleApplyBulk}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg shadow transition-all hover:scale-[1.02]"
              >
                Apply to {selectedIds.size} selected
              </button>

              {/* Clear selection */}
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        {/* 6. Anomaly List */}
        <div className="bg-wellqc-panel border border-wellqc-border rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-wellqc-border">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Detected Quality Anomalies
              </h2>
              <p className="text-xs text-wellqc-muted font-mono mt-0.5">
                Each anomaly requires petrophysical approval or explicit rejection. Nothing auto-applies.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {anomalies.length} items
            </span>
          </div>

          {anomalies.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p>No quality anomalies detected for this well log.</p>
            </div>
          ) : (
            <div className="space-y-3 font-sans">
              {anomalies.map((anomaly) => {
                const isSelected = selectedIds.has(anomaly.id);
                // Disabled & grayed out if type does not match first selected
                const isDisabledType =
                  selectedIds.size > 0 && firstSelectedType !== null && anomaly.anomalyType !== firstSelectedType;
                const isExpanded = expandedAnomalyId === anomaly.id;
                const options = getCorrectionOptionsForType(anomaly.anomalyType);
                const currentChosenOptionId =
                  selectedOptionMap[anomaly.id] || options.find((o) => o.recommended)?.id || options[0]?.id;

                return (
                  <div
                    key={anomaly.id}
                    className={`border rounded-xl transition-all ${
                      isDisabledType
                        ? "opacity-35 bg-wellqc-panel/40 border-wellqc-border/40 cursor-not-allowed"
                        : anomaly.status === "approved"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : anomaly.status === "rejected"
                        ? "bg-slate-900/50 border-slate-800"
                        : isSelected
                        ? "bg-cyan-500/10 border-cyan-500/50"
                        : "bg-wellqc-card border-wellqc-border hover:border-slate-700"
                    }`}
                  >
                    {/* Main Anomaly Row Content */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        {/* Checkbox with strict type-matching rule */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabledType}
                            onChange={() => handleToggleCheckbox(anomaly)}
                            className={`w-4 h-4 rounded text-cyan-500 bg-wellqc-dark border-slate-700 focus:ring-cyan-500 ${
                              isDisabledType ? "cursor-not-allowed" : "cursor-pointer"
                            }`}
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {/* Severity Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                                anomaly.severity === "CRITICAL"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                  : anomaly.severity === "WARNING"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              }`}
                            >
                              {anomaly.severity}
                            </span>

                            {/* Type — curveMnemonic title */}
                            <h4 className="text-sm font-bold text-white font-mono tracking-tight">
                              {anomaly.anomalyType} — {anomaly.curveMnemonic}
                            </h4>

                            {/* Depth Range */}
                            <span className="text-[11px] font-mono text-slate-400">
                              [{anomaly.depthStart.toFixed(1)} – {anomaly.depthEnd.toFixed(1)} {activeLas.wellInfo.depthUnit}]
                            </span>

                            {/* Current Status Badge */}
                            {anomaly.status === "approved" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Approved: {anomaly.appliedOptionLabel}</span>
                              </span>
                            )}
                            {anomaly.status === "rejected" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                Rejected (Untouched)
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 mt-1">{anomaly.description}</p>
                        </div>
                      </div>

                      {/* Row Action Buttons: Approve Fix and Reject */}
                      <div className="flex items-center space-x-2 shrink-0 font-mono text-xs">
                        <button
                          onClick={() => handleToggleApproveAccordion(anomaly)}
                          disabled={isDisabledType}
                          className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                            anomaly.status === "approved"
                              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                              : "bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40"
                          }`}
                        >
                          <span>{anomaly.status === "approved" ? "Edit fix" : "Approve fix"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleReject(anomaly)}
                          disabled={isDisabledType}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            anomaly.status === "rejected"
                              ? "bg-slate-800 text-slate-500 border border-slate-700"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-300 border border-slate-700"
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* 4. In-Place Accordion (Expands in place, NOT a modal) */}
                    {isExpanded && (
                      <div className="border-t border-wellqc-border bg-wellqc-panel/90 p-4 rounded-b-xl space-y-4 animate-in fade-in slide-in-from-top-1 duration-150 font-sans">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-wellqc-border">
                          <span>Select Petrophysical Correction Option:</span>
                          <span className="text-cyan-400 font-bold">{options.length} options available</span>
                        </div>

                        {/* Radio List of Options */}
                        <div className="space-y-2.5">
                          {options.map((opt) => {
                            const isRadioSelected = currentChosenOptionId === opt.id;
                            return (
                              <label
                                key={opt.id}
                                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  isRadioSelected
                                    ? "bg-cyan-500/10 border-cyan-500/50 text-white shadow-sm"
                                    : "bg-wellqc-card/60 border-wellqc-border/80 text-slate-300 hover:bg-wellqc-card"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`opt-${anomaly.id}`}
                                  value={opt.id}
                                  checked={isRadioSelected}
                                  onChange={() =>
                                    setSelectedOptionMap((prev) => ({ ...prev, [anomaly.id]: opt.id }))
                                  }
                                  className="mt-1 w-4 h-4 text-cyan-500 bg-wellqc-dark border-slate-700 focus:ring-cyan-500"
                                />
                                <div className="flex-1 text-xs">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold">{opt.label}</span>
                                    {opt.recommended && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        Recommended
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{opt.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        {/* Accordion Buttons: Confirm & Apply vs Cancel */}
                        <div className="flex items-center justify-end space-x-3 pt-2 font-mono text-xs">
                          <button
                            onClick={() => setExpandedAnomalyId(null)}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmApprove(anomaly)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg shadow-md transition-all hover:scale-[1.02]"
                          >
                            Confirm &amp; apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7. Graph: Cleaned Log Viewer (Bottom of the Page) */}
        <CleanedLogViewer
          wellName={currentWellName}
          field={activeLas.wellInfo.field || "Deepwater Basin"}
          operator={activeLas.wellInfo.company || "WellQC+ Telemetry"}
          depthUnit={activeLas.wellInfo.depthUnit || "FT"}
          rawLas={activeLas}
          cleanedLas={cleanedLas}
        />
      </div>

      {/* Confirmation Dialog Before Switching Wells (Don't discard silent work) */}
      {showSwitchConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-wellqc-panel border border-wellqc-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white font-mono">Unsaved Approvals</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have approved fixes on this well that have not been applied yet. Switching wells will reset your
              approvals and discard this work.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2 font-mono text-xs">
              <button
                onClick={() => {
                  setShowSwitchConfirmModal(false);
                  setPendingWellSwitchKey(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                Stay on current well
              </button>
              <button
                onClick={confirmDiscardAndSwitch}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
              >
                Discard &amp; switch well
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
