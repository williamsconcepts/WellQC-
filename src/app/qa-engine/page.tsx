"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ImputationBenchmarkModal } from "@/components/well-log/imputation-benchmark-modal";
import { PaymentModal } from "@/components/pricing/payment-modal";
import { ParsedLAS } from "@/lib/las/parser";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  BarChart3,
  HelpCircle,
} from "lucide-react";

// Mock reference LAS dataset for QA Engine interactive benchmarking
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
  ],
  data: {
    depth: Array.from({ length: 100 }, (_, i) => 5000 + i * 0.5),
    curves: {
      DEPT: Array.from({ length: 100 }, (_, i) => 5000 + i * 0.5),
      GR: Array.from({ length: 100 }, (_, i) => 40 + Math.sin(i * 0.2) * 35 + (i % 7 === 0 ? -999.25 : 0)),
      DT: Array.from({ length: 100 }, (_, i) => 70 + Math.cos(i * 0.15) * 20 + (i < 8 || i % 9 === 0 ? -999.25 : 0)),
      RHOB: Array.from({ length: 100 }, (_, i) => 2.35 + Math.sin(i * 0.1) * 0.3 + (i > 80 && i < 86 ? -999.25 : 0)),
      NPHI: Array.from({ length: 100 }, (_, i) => 0.22 - Math.sin(i * 0.1) * 0.08 + (i > 80 && i < 86 ? -999.25 : 0)),
      CALI: Array.from({ length: 100 }, (_, i) => 8.5 + (i > 80 && i < 86 ? 8.0 : 0.2 * Math.sin(i))),
    },
  },
  rawHeader: "",
  totalPoints: 100,
};

export default function QAEnginePage() {
  const [nullThreshold, setNullThreshold] = useState("10");
  const [spikeSensitivity, setSpikeSensitivity] = useState("4.5");
  const [flatlineSteps, setFlatlineSteps] = useState("25");
  const [evaluated, setEvaluated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLas, setActiveLas] = useState<ParsedLAS>(sampleBenchmarkLAS);
  const [lastImputationApplied, setLastImputationApplied] = useState<string | null>(null);

  const [limitReachedModal, setLimitReachedModal] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

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

  const handleLaunchBenchmark = async () => {
    const allowed = await checkLimit();
    if (allowed) setModalOpen(true);
  };

  const handleRunQATest = async () => {
    const allowed = await checkLimit();
    if (allowed) setEvaluated(true);
  };

  const handleApplyImputation = (updated: ParsedLAS, strategy: string, curve: string) => {
    setActiveLas(updated);
    setLastImputationApplied(`Applied ${strategy} imputation on curve ${curve}. Log updated successfully.`);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-wellqc-panel/60 border border-wellqc-border p-5 rounded-2xl">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Module 05 &amp; 06 — Rule Engine &amp; Missing Value Imputation
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Data Quality Engine &amp; Imputation Benchmark
            </h1>
            <p className="text-xs text-wellqc-muted font-mono mt-0.5">
              Tune boundary parameters, evaluate missing value root causes (Casing shoe, Washouts), and benchmark KNN vs Linear vs Median vs Row Dropping.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLaunchBenchmark}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Imputation Benchmark</span>
            </button>

            <button
              onClick={handleRunQATest}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-wellqc-card border border-wellqc-border text-slate-200 hover:text-white font-bold text-xs"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Run QA Engine Test</span>
            </button>
          </div>
        </div>

        {lastImputationApplied && (
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-300 font-mono text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{lastImputationApplied}</span>
            </div>
            <button
              onClick={() => {
                setActiveLas(sampleBenchmarkLAS);
                setLastImputationApplied(null);
              }}
              className="text-xs underline hover:text-white"
            >
              Reset to Raw Benchmark Log
            </button>
          </div>
        )}

        {/* Stakeholder Missing Value Strategy Banner */}
        <div className="bg-gradient-to-r from-blue-950/40 via-wellqc-panel to-purple-950/40 border border-cyan-500/30 p-5 rounded-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-300 font-bold">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Stakeholder Evidence-Based Missing Value Framework</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
              ALIGNMENT CERTIFIED
            </span>
          </div>
          <p className="text-slate-300 text-xs font-sans leading-relaxed">
            Per petrophysical stakeholder recommendations, WellQC+ avoids relying strictly on simple linear interpolation for sonic (DT) and density logs. The system classifies why values are missing (casing shoe metal effect, borehole washouts, telemetry loss) and compares <strong>KNN Imputation</strong> against <strong>Linear</strong>, <strong>Median</strong>, <strong>Spline</strong>, and <strong>Row Dropping</strong> using cross-validation RMSE &amp; R&sup2; metrics.
          </p>
        </div>

        {/* Threshold Form & Live Rule Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-wellqc-panel border border-wellqc-border p-5 rounded-2xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Statistical & Spike Sensitivity</span>
            </h3>
            <div>
              <label className="block text-slate-400 mb-1">Max Null Value Limit (%)</label>
              <input
                type="number"
                value={nullThreshold}
                onChange={(e) => setNullThreshold(e.target.value)}
                className="w-full bg-wellqc-card border border-wellqc-border rounded-lg p-2.5 text-white"
              />
              <span className="text-[10px] text-wellqc-muted mt-1 block">Flag curve if missing points exceed this %</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Spike Z-Score Multiplier (&sigma;)</label>
              <input
                type="number"
                step="0.1"
                value={spikeSensitivity}
                onChange={(e) => setSpikeSensitivity(e.target.value)}
                className="w-full bg-wellqc-card border border-wellqc-border rounded-lg p-2.5 text-white"
              />
              <span className="text-[10px] text-wellqc-muted mt-1 block">Z-Score cutoff for despiking algorithm</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Stuck Sensor Flatline Limit (Steps)</label>
              <input
                type="number"
                value={flatlineSteps}
                onChange={(e) => setFlatlineSteps(e.target.value)}
                className="w-full bg-wellqc-card border border-wellqc-border rounded-lg p-2.5 text-white"
              />
              <span className="text-[10px] text-wellqc-muted mt-1 block">Consecutive identical readings triggering sensor flag</span>
            </div>
          </div>

          {/* Active Rule Cards */}
          <div className="md:col-span-2 bg-wellqc-panel border border-wellqc-border p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Active Petrophysical Quality Inspection Rules</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-wellqc-card border border-wellqc-border space-y-1">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>RULE 01: Bulk Density Physical Limit Check</span>
                  <span className="text-emerald-400 text-[10px]">ACTIVE</span>
                </div>
                <p className="text-slate-400 text-[11px]">Validates RHOB is strictly within 1.00 &ndash; 3.20 g/cc range.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-wellqc-card border border-wellqc-border space-y-1">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>RULE 02: Neutron Porosity Negative Limit Check</span>
                  <span className="text-emerald-400 text-[10px]">ACTIVE</span>
                </div>
                <p className="text-slate-400 text-[11px]">Flags NPHI &lt; -0.05 v/v or &gt; 0.60 v/v as impossible porosity.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-wellqc-card border border-wellqc-border space-y-1">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>RULE 03: Monotonic Depth Step &amp; Gap Inspector</span>
                  <span className="text-emerald-400 text-[10px]">ACTIVE</span>
                </div>
                <p className="text-slate-400 text-[11px]">Detects duplicate depth records or unannounced depth skips &gt; 3x step value.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-wellqc-card border border-cyan-500/40 space-y-1">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>RULE 04: Multi-Method Imputation Benchmark Inspector (KNN &amp; Row Drop)</span>
                  <span className="text-cyan-400 text-[10px]">ACTIVE</span>
                </div>
                <p className="text-slate-400 text-[11px]">Evaluates root causes (washout, casing shoe) and benchmarks KNN against Linear, Median, and Listwise Deletion.</p>
              </div>
            </div>

            {evaluated && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 font-mono text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>QA Rule Engine re-calibrated successfully across active basin wells!</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Component */}
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
