"use client";

import { useState } from "react";
import { Layers, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { CurveHealthSummary } from "@/lib/las/quality-engine";
import { standardiseMnemonic } from "@/lib/las/standardiser";

interface CurveInventoryTableProps {
  curveSummaries: CurveHealthSummary[];
  title?: string;
  className?: string;
  compact?: boolean;
}

export function CurveInventoryTable({
  curveSummaries,
  title = "Curve Standardisation & Quality Inventory",
  className = "",
  compact = false,
}: CurveInventoryTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!curveSummaries || curveSummaries.length === 0) {
    return (
      <div className={`bg-wellqc-panel border border-wellqc-border rounded-2xl p-6 text-center space-y-2 ${className}`}>
        <Layers className="w-6 h-6 text-slate-500 mx-auto" />
        <p className="text-xs text-slate-400 font-mono">No curve summary data available for this well.</p>
      </div>
    );
  }

  const toggleRow = (mnemonic: string) => {
    setExpandedRow((prev) => (prev === mnemonic ? null : mnemonic));
  };

  return (
    <div className={`bg-wellqc-panel border border-wellqc-border rounded-2xl p-5 space-y-4 shadow-xl ${className}`}>
      {/* Table Header / Counter */}
      <div className="flex items-center justify-between pb-3 border-b border-wellqc-border">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {curveSummaries.length} {curveSummaries.length === 1 ? "Channel" : "Channels"} Detected
        </span>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-wellqc-card border-b border-wellqc-border text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3">Raw Mnemonic</th>
              <th className="p-3">Standard Name</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Null %</th>
              <th className="p-3">Range (Min – Max)</th>
              <th className="p-3">Health Score</th>
              <th className="p-3">Anomalies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wellqc-border text-slate-200">
            {curveSummaries.map((c, i) => {
              const std = standardiseMnemonic(c.mnemonic, c.unit);
              const isExpanded = expandedRow === c.mnemonic;
              const hasAnomalies = c.anomalies && c.anomalies.length > 0;

              return (
                <tr key={`${c.mnemonic}-${i}`} className="hover:bg-wellqc-card/50 transition-colors group">
                  <td className="p-3 font-bold text-white whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{c.mnemonic}</span>
                      {hasAnomalies && (
                        <button
                          type="button"
                          onClick={() => toggleRow(c.mnemonic)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-300 transition-opacity p-0.5"
                          title="Toggle anomaly breakdown"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-cyan-300 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 font-medium">
                      {std.standardMnemonic} ({std.matchedName})
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{c.unit || "—"}</td>
                  <td className="p-3 whitespace-nowrap">{c.nullPercentage.toFixed(1)}%</td>
                  <td className="p-3 whitespace-nowrap text-slate-300">
                    {c.minVal !== null && c.maxVal !== null
                      ? `${c.minVal.toFixed(2)} – ${c.maxVal.toFixed(2)}`
                      : "All Null"}
                  </td>
                  <td className="p-3 font-bold whitespace-nowrap">
                    <span
                      className={
                        c.healthScore >= 90
                          ? "text-emerald-400"
                          : c.healthScore >= 75
                          ? "text-cyan-400"
                          : c.healthScore >= 50
                          ? "text-amber-400"
                          : "text-rose-400"
                      }
                    >
                      {c.healthScore}/100
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {hasAnomalies ? (
                      <button
                        type="button"
                        onClick={() => toggleRow(c.mnemonic)}
                        className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold hover:bg-amber-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Click to inspect flagged anomalies"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>{c.anomalies.length} {c.anomalies.length === 1 ? "Flag" : "Flags"}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Clean ✓</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Anomaly Details Row */}
      {expandedRow && (() => {
        const curve = curveSummaries.find((c) => c.mnemonic === expandedRow);
        if (!curve || !curve.anomalies || curve.anomalies.length === 0) return null;

        return (
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 font-mono">
                  Quality Flags for {curve.mnemonic} ({curve.anomalies.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedRow(null)}
                className="text-[11px] text-slate-400 hover:text-white font-mono"
              >
                Close Details
              </button>
            </div>
            <div className="space-y-2">
              {curve.anomalies.map((ano, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{ano.anomalyType.replace(/_/g, " ")}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        ano.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {ano.severity}
                    </span>
                  </div>
                  <p className="text-slate-300">{ano.description}</p>
                  {ano.suggestedCorrection && (
                    <p className="text-cyan-300/90 text-[10px]">
                      Correction: {ano.suggestedCorrection}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
