"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  Lock,
} from "lucide-react";
import { PAYSTACK_PLANS, PaymentCurrency } from "@/lib/paystack";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: "pro_monthly" | "pro_annual" | "enterprise";
  onSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  defaultPlan = "pro_monthly",
}: PaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlan);
  const [currency, setCurrency] = useState<PaymentCurrency>("NGN");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Ensure portal target (document.body) is available on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update default plan if prop changes
  useEffect(() => {
    if (defaultPlan) {
      setSelectedPlanId(defaultPlan);
      if (defaultPlan === "pro_annual") {
        setBillingCycle("annual");
      }
    }
  }, [defaultPlan]);

  // Lock body scroll and listen for ESC key when modal is active
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const currentPlanKey =
    selectedPlanId === "enterprise"
      ? "enterprise"
      : billingCycle === "annual"
      ? "pro_annual"
      : "pro_monthly";

  const selectedPlan = PAYSTACK_PLANS[currentPlanKey] || PAYSTACK_PLANS.pro_monthly;

  const handlePaystackCheckout = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.status || !data.authorizationUrl) {
        throw new Error(data.error || "Unable to initialize Paystack transaction.");
      }

      // Redirect user directly to the Paystack checkout page
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Payment initialization failed.");
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto text-slate-100 relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border-b border-slate-800 flex items-start justify-between relative">
          <div className="space-y-1 pr-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>WellQC+ Payment Portal</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Upgrade Subscription Tier
            </h2>
            <p className="text-xs text-slate-400">
              Unlock unlimited petrophysical log audits, KNN curve imputation, and PDF certificates.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Currency & Billing Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            {/* Currency Toggle */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-400 font-mono">Currency:</span>
              <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrency("NGN")}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    currency === "NGN"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ₦ NGN (Naira)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    currency === "USD"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  $ USD (Dollar)
                </button>
              </div>
            </div>

            {/* Billing Interval Toggle */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-400 font-mono">Billing:</span>
              <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle("monthly");
                    setSelectedPlanId("pro_monthly");
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === "monthly" && selectedPlanId !== "enterprise"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle("annual");
                    setSelectedPlanId("pro_annual");
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    billingCycle === "annual" && selectedPlanId !== "enterprise"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>Annual</span>
                  <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-400 text-slate-950 font-black">
                    -17%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Selected Plan Details Card */}
          <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/90 border-2 border-emerald-500/60 rounded-xl p-4 sm:p-5 relative shadow-lg shadow-emerald-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <span>{selectedPlan.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Active Choice
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedPlan.description}</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {currency === "NGN"
                    ? `₦${selectedPlan.amountNgn.toLocaleString()}`
                    : `$${selectedPlan.amountUsd}`}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {selectedPlan.interval === "annually"
                    ? "/ year (2 months free)"
                    : "/ month"}
                </div>
              </div>
            </div>

            {/* Plan Features Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
              {selectedPlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Nigerian & Global Payment Channels (Paystack) */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
              <span>Accepted Payment Methods (Powered by Paystack)</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                256-Bit SSL Encrypted
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex flex-col items-center justify-center gap-1">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-semibold">Cards (Verve / Visa / MC)</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex flex-col items-center justify-center gap-1">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-semibold">Bank Transfer</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex flex-col items-center justify-center gap-1">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-semibold">USSD &amp; Mobile</span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {errorMessage}
            </div>
          )}

          {/* Checkout CTA */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handlePaystackCheckout}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    Pay{" "}
                    {currency === "NGN"
                      ? `₦${selectedPlan.amountNgn.toLocaleString()}`
                      : `$${selectedPlan.amountUsd}`}{" "}
                    with Paystack
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant activation &amp; 100% money-back guarantee within 14 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
