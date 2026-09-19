import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CleanedLogViewer } from "../well-log/cleaned-log-viewer";
import { ParsedLAS } from "@/lib/las/parser";
import { getCorrectionOptionsForType } from "@/lib/las/anomaly-options";

const mockRawLas: ParsedLAS = {
  version: "2.0",
  wrap: false,
  wellInfo: {
    wellName: "TEST-WELL-A",
    company: "TEST CORP",
    field: "TEST FIELD",
    location: "OFFSHORE",
    country: "NIGERIA",
    state: "",
    apiUwi: "API-999-001",
    serviceCompany: "SLB",
    date: "2026-03-15",
    startDepth: 4000,
    stopDepth: 4002,
    step: 0.5,
    nullValue: -999.25,
    depthUnit: "FT",
  },
  curves: [
    { mnemonic: "DEPT", unit: "FT", code: "1000", description: "DEPTH" },
    { mnemonic: "GR", unit: "GAPI", code: "2000", description: "GAMMA RAY" },
    { mnemonic: "RT", unit: "OHMM", code: "4000", description: "RESISTIVITY" },
    { mnemonic: "DT", unit: "US/F", code: "3000", description: "SONIC" },
  ],
  data: {
    depth: [4000, 4000.5, 4001, 4001.5, 4002],
    curves: {
      DEPT: [4000, 4000.5, 4001, 4001.5, 4002],
      GR: [45, 50, 55, 60, 65],
      RT: [2, 5, 20, 100, 500],
      DT: [75, 78, 80, 82, 85],
    },
  },
  rawHeader: "",
  totalPoints: 5,
};

describe("CleanedLogViewer Component", () => {
  it("renders 3-track wireline layout with logarithmic resistivity scale and linear GR/Sonic", () => {
    render(
      <CleanedLogViewer
        wellName="TEST-WELL-A"
        rawLas={mockRawLas}
        cleanedLas={mockRawLas}
      />
    );

    // Title and Header
    expect(screen.getByText(/Cleaned Log Viewer/i)).toBeInTheDocument();
    expect(screen.getByText(/BOREHOLE LOG: TEST-WELL-A/i)).toBeInTheDocument();

    // Track selectors
    expect(screen.getByText(/Track 1:/i)).toBeInTheDocument();
    expect(screen.getByText(/Track 2:/i)).toBeInTheDocument();
    expect(screen.getByText(/Track 3:/i)).toBeInTheDocument();

    // Track 2 Resistivity logarithmic scale header and decades
    expect(screen.getByText(/Logarithmic Scale/i)).toBeInTheDocument();
    expect(screen.getByText("0.2")).toBeInTheDocument();
    expect(screen.getByText("2000")).toBeInTheDocument();

    // Compare to raw checkbox is present
    expect(screen.getByLabelText(/Compare to raw \(pre-clean\)/i)).toBeInTheDocument();
  });

  it("toggles Compare to raw overlay checkbox", () => {
    render(
      <CleanedLogViewer
        wellName="TEST-WELL-A"
        rawLas={mockRawLas}
        cleanedLas={mockRawLas}
      />
    );

    const checkbox = screen.getByLabelText(/Compare to raw \(pre-clean\)/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    // Uncheck
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });
});

describe("Anomaly Options Logic", () => {
  it("provides options with exactly one recommended option per anomaly type", () => {
    const spikeOptions = getCorrectionOptionsForType("EXTREME_SPIKE");
    expect(spikeOptions.length).toBeGreaterThan(1);
    const recommendedSpike = spikeOptions.filter((o) => o.recommended);
    expect(recommendedSpike.length).toBe(1);

    const depthOptions = getCorrectionOptionsForType("DUPLICATE_DEPTH");
    expect(depthOptions.length).toBeGreaterThan(1);
    const recommendedDepth = depthOptions.filter((o) => o.recommended);
    expect(recommendedDepth.length).toBe(1);

    const nullOptions = getCorrectionOptionsForType("NULL_CLUSTER");
    expect(nullOptions.some((o) => o.id === "KNN_IMPUTATION")).toBe(true);
  });
});
