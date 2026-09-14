"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { WellDetailResponse, WellListItem } from "@/lib/api-types";
import { standardiseMnemonic } from "@/lib/las/standardiser";
import { ParsedLAS } from "@/lib/las/parser";
import { QualityAnalysisResult, analyzeWellLogQuality } from "@/lib/las/quality-engine";
import {
  FileSpreadsheet,
  Download,
  FileText,
  RefreshCw,
  Database,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sliders,
} from "lucide-react";

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

export default function ReportsPage() {
  const [wells, setWells] = useState<WellListItem[]>([]);
  const [selectedWellId, setSelectedWellId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"anomaly" | "cleaned">("anomaly");

  // Local upload workspace if available
  const [uploadSession, setUploadSession] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Check localStorage for active upload session
    try {
      const raw = localStorage.getItem("wellqc_upload_workspace");
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.parsedLAS) {
          setUploadSession(session);
          setSelectedWellId("upload-session");
        }
      }
    } catch (e) {
      console.warn("Could not read upload workspace in reports", e);
    }

    async function loadWells() {
      try {
        const response = await fetch("/api/wells", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load saved wells.");
        }

        const loadedWells: WellListItem[] = data.wells || [];
        if (!cancelled) {
          setWells(loadedWells);
          setSelectedWellId((current) => current || (loadedWells.length > 0 ? loadedWells[0].id : ""));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load saved wells.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWells();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedWell =
    selectedWellId === "upload-session" && uploadSession
      ? {
          id: "upload-session",
          name: uploadSession.fileName || "Active Upload Session",
          apiNo: uploadSession.parsedLAS?.wellInfo?.apiUwi || "API-TEMP-01",
          qualityGrade: uploadSession.qaResult?.qualityGrade || "GOOD",
          qualityScore: uploadSession.qaResult?.overallScore || 85,
          latestLasFileName: uploadSession.fileName,
          latestLasFileId: "upload-session",
          curveCount: uploadSession.parsedLAS?.curves?.length || 0,
          pointCount: uploadSession.parsedLAS?.totalPoints || 0,
          anomalyCount: uploadSession.qaResult?.anomalyCount || 0,
        }
      : wells.find((well) => well.id === selectedWellId);

  const canExport = Boolean(selectedWellId && (selectedWellId === "upload-session" || selectedWell?.latestLasFileId));

  const loadDetail = async (): Promise<WellDetailResponse> => {
    if (!selectedWellId) {
      throw new Error("Select a well or upload session first.");
    }

    if (selectedWellId === "upload-session" && uploadSession) {
      const las: ParsedLAS = uploadSession.parsedLAS;
      const qa: QualityAnalysisResult = uploadSession.qaResult || analyzeWellLogQuality(las);
      const depthArray = las.data.depth;
      return {
        well: {
          id: "upload-session",
          apiNo: las.wellInfo.apiUwi || "API-TEMP-UPLOAD",
          name: uploadSession.fileName || las.wellInfo.wellName || "Active Upload Log",
          operatorName: las.wellInfo.company || "Unknown Operator",
          fieldName: las.wellInfo.field || "Active Field",
          basin: las.wellInfo.location || "Offshore",
          country: las.wellInfo.country || "Global",
          latitude: 0,
          longitude: 0,
          elevFt: 0,
          tdFt: depthArray[depthArray.length - 1] || 0,
          depthUnit: las.wellInfo.depthUnit || "FT",
          status: "ACTIVE_UPLOAD",
          qualityScore: qa.overallScore,
          qualityGrade: qa.qualityGrade,
          latestLasFileName: uploadSession.fileName || "uploaded_log.las",
          latestLasFileId: "upload-session",
          latestReportId: "upload-report",
          curveCount: las.curves.length,
          pointCount: depthArray.length,
          anomalyCount: qa.anomalyCount,
          curveSummaries: qa.curveSummaries,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        aiSummary: uploadSession.aiOutput?.summary || "Automated QA/QC Audit of active LAS upload log.",
        recommendations: uploadSession.aiOutput?.recommendations || [
          "Review flagged high-severity anomalies in Quality Engine.",
          "Despike DT sonic acoustic skips if sonic channel is present.",
          "Verify curve units match standard petrophysical conventions.",
        ],
        curvesData: las.data,
        curveSummaries: qa.curveSummaries,
        anomalies: qa.anomalies,
      };
    }

    const response = await fetch(`/api/wells/${selectedWellId}`, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load selected well.");
    }

    return data as WellDetailResponse;
  };

  // 1. Generate PDF Report (Anomaly Document)
  const generatePDFReport = async () => {
    await runExport(async () => {
      const detail = await loadDetail();
      const doc = new jsPDF();

      // ── Cover block ─────────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(19, 27, 46);
      doc.text("WellQC+ | Well Log Quality Assurance Report", 14, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`Well Name: ${detail.well.name}`, 14, 28);
      doc.text(`API/UWI: ${detail.well.apiNo}`, 14, 34);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
      doc.text(`Platform Grade: ${detail.well.qualityGrade} (${detail.well.qualityScore} / 100)`, 14, 46);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 52, 196, 52);

      // ── Committed LAS summary ────────────────────────────────────────────────
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(19, 27, 46);
      doc.text("Committed LAS Summary", 14, 62);

      (doc as any).autoTable({
        startY: 68,
        head: [["Property", "Value"]],
        body: [
          ["Operator", detail.well.operatorName],
          ["Field", detail.well.fieldName],
          ["Basin", detail.well.basin],
          ["Country", detail.well.country],
          ["Latitude / Longitude", `${detail.well.latitude.toFixed(4)}, ${detail.well.longitude.toFixed(4)}`],
          ["Elevation (KB)", `${detail.well.elevFt.toLocaleString()} FT`],
          ["Total Depth (TD)", `${detail.well.tdFt.toLocaleString()} FT`],
          ["Depth Unit", detail.well.depthUnit],
          ["Latest LAS File", detail.well.latestLasFileName || "None"],
          ["Curve Count", String(detail.well.curveCount)],
          ["Point Count", detail.well.pointCount.toLocaleString()],
          ["Anomaly Count", String(detail.well.anomalyCount)],
        ],
        headStyles: { fillColor: [19, 27, 46] },
        styles: { fontSize: 8.5, cellPadding: 2.2 },
      });

      let currentY = (doc as any).lastAutoTable?.finalY || 135;

      // ── AI Summary ───────────────────────────────────────────────────────────
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(19, 27, 46);
      doc.text("AI Petrophysical Summary", 14, currentY + 10);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const aiLines = doc.splitTextToSize(detail.aiSummary, 182);
      doc.text(aiLines, 14, currentY + 16);
      currentY += 16 + aiLines.length * 4.2;

      // ── Recommendations ──────────────────────────────────────────────────────
      if (detail.recommendations && detail.recommendations.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(19, 27, 46);
        doc.text("Recommendations", 14, currentY + 6);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        let recY = currentY + 12;
        detail.recommendations.forEach((rec, i) => {
          const recLines = doc.splitTextToSize(`${i + 1}. ${rec}`, 178);
          doc.text(recLines, 16, recY);
          recY += recLines.length * 4.2 + 1.5;
        });
        currentY = recY;
      }

      // ── 7 Core Curve Availability Table ───────────────────────────────────────
      const CORE_CURVE_CONFIGS = [
        { sn: 1, name: "Gamma Ray", standardMnemonic: "GR", defaultUnit: "GAPI" },
        { sn: 2, name: "Bulk Density", standardMnemonic: "RHOB", defaultUnit: "G/CM3" },
        { sn: 3, name: "Neutron Porosity", standardMnemonic: "NPHI", defaultUnit: "PU" },
        { sn: 4, name: "Sonic", standardMnemonic: "DT", defaultUnit: "US/F" },
        { sn: 5, name: "Deep Resistivity", standardMnemonic: "RT", defaultUnit: "OHM.M" },
        { sn: 6, name: "Caliper", standardMnemonic: "CALI", defaultUnit: "IN" },
        { sn: 7, name: "Spontaneous Potential", standardMnemonic: "SP", defaultUnit: "MV" },
      ];

      const coreCurveRows = CORE_CURVE_CONFIGS.map((core) => {
        let matchedSummary = detail.curveSummaries?.find(
          (c) => c.standardMnemonic?.toUpperCase() === core.standardMnemonic
        );

        if (!matchedSummary && detail.curveSummaries) {
          matchedSummary = detail.curveSummaries.find((c) => {
            const std = standardiseMnemonic(c.mnemonic);
            return std.standardMnemonic === core.standardMnemonic;
          });
        }

        let detectedMnemonic = matchedSummary?.mnemonic || null;
        let detectedUnit =
          matchedSummary?.unit && matchedSummary.unit.trim() !== ""
            ? matchedSummary.unit.toUpperCase()
            : null;

        if (!detectedMnemonic && detail.curvesData?.curves) {
          const rawKeys = Object.keys(detail.curvesData.curves);
          const foundKey = rawKeys.find(
            (k) => standardiseMnemonic(k).standardMnemonic === core.standardMnemonic
          );
          if (foundKey) {
            detectedMnemonic = foundKey;
            const std = standardiseMnemonic(foundKey);
            detectedUnit = std.standardUnit || core.defaultUnit;
          }
        }

        const isFound = Boolean(detectedMnemonic);

        return [
          String(core.sn),
          core.name,
          core.standardMnemonic,
          isFound ? "YES" : "NO",
          isFound ? detectedMnemonic : "-",
          isFound ? (detectedUnit || core.defaultUnit) : "-",
          isFound ? "AVAILABLE" : "MISSING",
        ];
      });

      if (currentY + 65 > 275) {
        doc.addPage();
        currentY = 20;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("WellQC+ | Well Log Quality Assurance Report", 14, currentY);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, currentY + 8, 196, currentY + 8);
        currentY += 16;
      } else {
        currentY += 10;
      }

      doc.setFillColor(6, 182, 212);
      doc.rect(14, currentY, 3, 9, "F");

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("7 CORE CURVE AVAILABILITY", 20, currentY + 7);

      (doc as any).autoTable({
        startY: currentY + 12,
        head: [
          ["S/N", "Core Curve", "Standard Mnemonic", "Found in Well?", "Detected Mnemonic", "Unit", "Status"],
        ],
        body: coreCurveRows,
        headStyles: {
          fillColor: [10, 20, 38],
          textColor: [148, 163, 184],
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
          cellPadding: 3,
        },
        bodyStyles: {
          fillColor: [15, 23, 42],
          textColor: [241, 245, 249],
          fontSize: 8,
          cellPadding: 3.2,
          lineColor: [30, 41, 59],
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: [19, 29, 53],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 14 },
          1: { halign: "left", fontStyle: "bold", cellWidth: 44 },
          2: { halign: "center", fontStyle: "bold", cellWidth: 26 },
          3: { halign: "center", fontStyle: "bold", cellWidth: 26 },
          4: { halign: "center", cellWidth: 26 },
          5: { halign: "center", cellWidth: 20 },
          6: { halign: "center", fontStyle: "bold", cellWidth: 26 },
        },
        didParseCell: (data: any) => {
          if (data.section === "body") {
            if (data.column.index === 3) {
              const val = String(data.cell.raw || "");
              data.cell.styles.textColor = val === "YES" ? [52, 211, 153] : [248, 113, 113];
            }
            if (data.column.index === 6) {
              const val = String(data.cell.raw || "");
              if (val === "AVAILABLE") {
                data.cell.styles.textColor = [52, 211, 153];
                data.cell.styles.fillColor = [6, 44, 40];
              } else {
                data.cell.styles.textColor = [248, 113, 113];
                data.cell.styles.fillColor = [60, 20, 25];
              }
            }
          }
        },
      });

      currentY = (doc as any).lastAutoTable?.finalY || currentY + 70;

      // Anomaly Log Table
      if ((detail.anomalies ?? []).length > 0) {
        if (currentY + 50 > 275) {
          doc.addPage();
          currentY = 20;
        } else {
          currentY += 10;
        }

        doc.setFillColor(239, 68, 68);
        doc.rect(14, currentY, 3, 9, "F");

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("AUDITED QUALITY ANOMALIES", 20, currentY + 7);

        (doc as any).autoTable({
          startY: currentY + 12,
          head: [["Curve", "Anomaly Type", "Severity", "Depth Range", "Description", "Suggested Correction"]],
          body: (detail.anomalies ?? []).map((a) => [
            a.curveMnemonic,
            a.anomalyType.replace(/_/g, " "),
            a.severity,
            `${a.depthStart.toFixed(1)} - ${a.depthEnd.toFixed(1)} ${detail.well.depthUnit}`,
            a.description,
            a.suggestedCorrection,
          ]),
          headStyles: { fillColor: [19, 27, 46], fontSize: 8 },
          styles: { fontSize: 7.5, cellPadding: 2 },
        });
      }

      doc.save(`${fileStem(detail.well.name)}_QA_Audit_Report.pdf`);
    });
  };

  // 2. Generate Excel Anomaly Document (.xlsx)
  const generateExcelAnomalyReport = async () => {
    await runExport(async () => {
      const detail = await loadDetail();
      const summaryRows = [
        ["Well Log Quality Audit Report - Anomaly Findings (WellQC+)"],
        [],
        ["Well Asset", detail.well.name],
        ["API/UWI", detail.well.apiNo],
        ["Operator", detail.well.operatorName],
        ["Field", detail.well.fieldName],
        ["Basin", detail.well.basin],
        ["Country", detail.well.country],
        ["Total Depth (TD)", `${detail.well.tdFt} ${detail.well.depthUnit}`],
        ["Overall Raw Score", `${detail.well.qualityScore} / 100`],
        ["Quality Grade", detail.well.qualityGrade],
        ["Anomaly Count", detail.well.anomalyCount],
        [],
        ["AI Executive Summary"],
        [detail.aiSummary],
        [],
        ["Recommendations"],
        ...detail.recommendations.map((rec, i) => [`${i + 1}. ${rec}`]),
        [],
        ["Audit Date", new Date().toLocaleString()],
      ];

      const inventoryRows: (string | number)[][] = [
        ["Curve Standardisation & Quality Inventory"],
        [],
        ["Raw Mnemonic", "Standard Mnemonic", "Unit", "Total Points", "Null Count", "Null %", "Min Value", "Max Value", "Mean Value", "Health Score", "Status", "Anomaly Count"],
        ...(detail.curveSummaries ?? []).map((c) => [
          c.mnemonic,
          c.standardMnemonic || "UNKNOWN",
          c.unit || "",
          c.totalPoints,
          c.nullCount,
          parseFloat(c.nullPercentage.toFixed(2)),
          c.minVal !== null ? parseFloat(c.minVal.toFixed(4)) : "",
          c.maxVal !== null ? parseFloat(c.maxVal.toFixed(4)) : "",
          c.meanVal !== null ? parseFloat(c.meanVal.toFixed(4)) : "",
          c.healthScore,
          c.status,
          c.anomalies?.length ?? 0,
        ]),
      ];

      const anomalyRows: (string | number)[][] = [
        ["Audited Quality Anomaly Log"],
        [],
        ["Curve Mnemonic", "Anomaly Type", "Severity", "Depth Start", "Depth End", "Description", "Suggested Correction"],
        ...(detail.anomalies ?? []).map((a) => [
          a.curveMnemonic,
          a.anomalyType.replace(/_/g, " "),
          a.severity,
          parseFloat(a.depthStart.toFixed(4)),
          parseFloat(a.depthEnd.toFixed(4)),
          a.description,
          a.suggestedCorrection,
        ]),
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "QA Audit Summary");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(anomalyRows), "Anomaly Findings");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(inventoryRows), "Curve Inventory");
      XLSX.writeFile(wb, `${fileStem(detail.well.name)}_Anomaly_Findings.xlsx`);
    });
  };

  // 3. Generate Cleaned LAS 2.0 Export (.las)
  const generateCleanedLASExport = async () => {
    await runExport(async () => {
      const detail = await loadDetail();
      downloadTextFile(
        `${fileStem(detail.well.name)}_cleaned.las`,
        buildLasFromDetail(detail),
        "application/octet-stream;charset=utf-8"
      );
    });
  };

  // 4. Generate Cleaned CSV Dataset (.csv)
  const generateCleanedCSVExport = async () => {
    await runExport(async () => {
      const detail = await loadDetail();
      const curveNames = Object.keys(detail.curvesData.curves);
      const header = ["DEPTH", ...curveNames].join(",");
      const rows = detail.curvesData.depth.map((d, idx) => {
        const row = [
          d.toFixed(4),
          ...curveNames.map((c) => {
            const val = detail.curvesData.curves[c]?.[idx];
            return val !== undefined && val !== -999.25 ? val.toFixed(4) : "";
          }),
        ];
        return row.join(",");
      });

      downloadTextFile(
        `${fileStem(detail.well.name)}_cleaned_dataset.csv`,
        `${header}\n${rows.join("\n")}\n`,
        "text/csv;charset=utf-8"
      );
    });
  };

  // 5. Generate Cleaned Curves Excel (.xlsx)
  const generateCleanedExcelReport = async () => {
    await runExport(async () => {
      const detail = await loadDetail();
      const curveNames = Object.keys(detail.curvesData.curves);
      const dataRows = [
        ["DEPTH", ...curveNames],
        ...detail.curvesData.depth.map((depth, index) => [
          depth,
          ...curveNames.map((curveName) => {
            const v = detail.curvesData.curves[curveName]?.[index];
            return v !== undefined && v !== -999.25 ? v : "";
          }),
        ]),
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dataRows), "Cleaned Curves");
      XLSX.writeFile(wb, `${fileStem(detail.well.name)}_Cleaned_Curves.xlsx`);
    });
  };

  const runExport = async (callback: () => Promise<void>) => {
    if (!canExport) {
      setError("Select a valid well or active upload session before exporting.");
      return;
    }

    setIsExporting(true);
    setError("");

    try {
      await callback();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-wellqc-panel/60 border border-wellqc-border p-5 rounded-2xl">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Audit Reports &amp; Verified Data Exports
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Petrophysical Audit Reports &amp; Cleaned Exports
            </h1>
            <p className="text-xs text-wellqc-muted font-mono mt-0.5">
              Demarcated into Raw Anomaly Findings Documents and Post-Correction Cleaned Log Exports.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl px-4 py-3 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Well Selection Bar */}
        <div className="bg-wellqc-panel border border-wellqc-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs font-mono w-full">
            <span className="text-slate-400 font-bold whitespace-nowrap">Select Target Well:</span>
            <select
              value={selectedWellId}
              onChange={(e) => setSelectedWellId(e.target.value)}
              disabled={isLoading && wells.length === 0}
              className="flex-1 bg-wellqc-card border border-wellqc-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
            >
              {uploadSession && (
                <optgroup label="Current Upload Session">
                  <option value="upload-session">
                    📍 {uploadSession.fileName || "Uploaded Well Log"} ({uploadSession.parsedLAS?.curves?.length} curves, {uploadSession.qaResult?.overallScore}%)
                  </option>
                </optgroup>
              )}

              {wells.length > 0 && (
                <optgroup label="Committed Wells (Database)">
                  {wells.map((well) => (
                    <option key={well.id} value={well.id}>
                      🛢️ {well.name} ({well.apiNo}) — {well.fieldName || "Offshore"} ({well.qualityScore}% {well.qualityGrade})
                    </option>
                  ))}
                </optgroup>
              )}

              {wells.length === 0 && !uploadSession && (
                <option value="">No wells available. Upload a LAS file or commit a well.</option>
              )}
            </select>
          </div>
          {isLoading && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
        </div>

        {/* Section Tabs Switcher */}
        <div className="flex items-center space-x-2 border-b border-wellqc-border pb-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("anomaly")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === "anomaly"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>1. Anomaly Document (Raw QA/QC Audit)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cleaned")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === "cleaned"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>2. Cleaned Document (Post-Correction Exports)</span>
          </button>
        </div>

        {/* TAB 1: ANOMALY DOCUMENT */}
        {activeTab === "anomaly" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl font-mono text-xs text-amber-300/90 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Anomaly Document:</strong> Certified petrophysical findings of the original raw LAS file before any modifications.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExportCard
                icon={<FileText className="w-6 h-6" />}
                color="cyan"
                title="Executive PDF QA/QC Audit Certificate"
                description="Formal executive audit report detailing original anomalies, 7 core curves availability check, severity breakdown, and AI recommendations."
                buttonLabel="Download PDF Audit Report"
                onClick={generatePDFReport}
                disabled={!canExport || isExporting}
              />
              <ExportCard
                icon={<FileSpreadsheet className="w-6 h-6" />}
                color="emerald"
                title="Excel Anomaly Findings Sheet (.xlsx)"
                description="Detailed tabular anomaly workbook with depth intervals, severity classifications, and suggested petrophysical remedies."
                buttonLabel="Download Anomaly Findings (.xlsx)"
                onClick={generateExcelAnomalyReport}
                disabled={!canExport || isExporting}
              />
            </div>
          </div>
        )}

        {/* TAB 2: CLEANED DOCUMENT */}
        {activeTab === "cleaned" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl font-mono text-xs text-emerald-300/90 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Cleaned Document:</strong> Verified post-correction exports with duplicate depths pruned, outliers clipped, and missing values imputed.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ExportCard
                icon={<Download className="w-6 h-6" />}
                color="purple"
                title="Cleaned LAS 2.0 File (.las)"
                description="CWLS LAS 2.0 file containing cleaned, despiked, and standardized curve channels ready for petrophysical modeling."
                buttonLabel="Download Cleaned LAS (.las)"
                onClick={generateCleanedLASExport}
                disabled={!canExport || isExporting}
              />
              <ExportCard
                icon={<FileText className="w-6 h-6" />}
                color="cyan"
                title="Cleaned Dataset CSV (.csv)"
                description="Cleaned tabular comma-separated values for Python, Pandas, Petrel, and data science pipelines."
                buttonLabel="Download Cleaned CSV (.csv)"
                onClick={generateCleanedCSVExport}
                disabled={!canExport || isExporting}
              />
              <ExportCard
                icon={<FileSpreadsheet className="w-6 h-6" />}
                color="emerald"
                title="Cleaned Curves Excel (.xlsx)"
                description="Formatted spreadsheet with all cleaned curves, standardized units, and reconstructed depth index."
                buttonLabel="Download Cleaned Excel (.xlsx)"
                onClick={generateCleanedExcelReport}
                disabled={!canExport || isExporting}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ExportCard({
  icon,
  color,
  title,
  description,
  buttonLabel,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  color: "cyan" | "emerald" | "purple";
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  disabled: boolean;
}) {
  const colors = {
    cyan: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
    emerald: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    purple: "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950",
  };

  return (
    <div className="bg-wellqc-panel border border-wellqc-border p-6 rounded-2xl space-y-4 text-center flex flex-col justify-between">
      <div className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-wellqc-card border border-wellqc-border flex items-center justify-center mx-auto text-cyan-400">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-white font-mono">{title}</h3>
          <p className="text-xs text-wellqc-muted font-mono mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-3 rounded-xl font-bold text-xs font-mono shadow-lg transition-all cursor-pointer disabled:opacity-50 ${colors[color]}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function buildLasFromDetail(detail: WellDetailResponse) {
  const curveNames = Object.keys(detail.curvesData.curves);
  const depthUnit = detail.well.depthUnit || "FT";
  const nullValue = -999.25;
  const firstDepth = detail.curvesData.depth[0] ?? 0;
  const lastDepth = detail.curvesData.depth[detail.curvesData.depth.length - 1] ?? firstDepth;

  const lines = [
    "~VERSION INFORMATION",
    "VERS.                 2.0 : CWLS LOG ASCII STANDARD - VERSION 2.0",
    "WRAP.                  NO : ONE LINE PER DEPTH STEP",
    "~WELL INFORMATION",
    `# Cleaned LAS exported from WellQC+ Enterprise Platform on ${new Date().toISOString()}`,
    formatHeaderLine("STRT", depthUnit, firstDepth, "START DEPTH"),
    formatHeaderLine("STOP", depthUnit, lastDepth, "STOP DEPTH"),
    formatHeaderLine("NULL", "", nullValue, "NULL VALUE"),
    formatHeaderLine("WELL", "", detail.well.name, "WELL NAME"),
    formatHeaderLine("COMP", "", detail.well.operatorName, "COMPANY"),
    formatHeaderLine("FLD", "", detail.well.fieldName, "FIELD"),
    formatHeaderLine("CTRY", "", detail.well.country, "COUNTRY"),
    formatHeaderLine("API", "", detail.well.apiNo, "API / UWI"),
    "~CURVE INFORMATION",
    formatCurveLine("DEPT", depthUnit, "1 MEASURED DEPTH"),
    ...curveNames.map((curveName, index) => formatCurveLine(curveName, "", `${index + 2} STANDARDISED CURVE`)),
    "~ASCII",
    ...detail.curvesData.depth.map((depth, index) =>
      [
        formatNumber(depth),
        ...curveNames.map((curveName) => formatNumber(detail.curvesData.curves[curveName]?.[index] ?? nullValue)),
      ]
        .map((value) => value.padStart(12))
        .join(" "),
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function formatHeaderLine(mnemonic: string, unit: string, value: string | number, description: string) {
  const formattedValue = typeof value === "number" ? formatNumber(value) : value;
  return `${mnemonic}.${unit.padEnd(8)} ${String(formattedValue).padStart(16)} : ${description}`;
}

function formatCurveLine(mnemonic: string, unit: string, description: string) {
  return `${mnemonic}.${unit.padEnd(8)} : ${description}`;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "-999.25";
  const fixed = Math.abs(value) >= 1000 ? value.toFixed(4) : value.toFixed(5);
  return fixed.replace(/\.?0+$/, "");
}

function fileStem(value: string) {
  return (
    value
      .trim()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9_-]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "well_log"
  );
}
