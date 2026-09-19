import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { WellLogViewer } from "../well-log/log-viewer";
import { WellLogDataTable } from "../well-log/log-data-table";

describe("WellLogDataTable Component", () => {
  const mockCurvesData = {
    depth: [5000, 5000.5, 5001, 5001.5, 5002],
    curves: {
      GR: [45.2, 48.0, -999.25, 52.1, 55.4],
      RT: [12.5, 14.2, 13.8, 15.1, 16.0],
      DT: [85.0, 84.5, 86.2, 85.8, 87.0],
    },
  };

  const mockAnomalies = [
    {
      depthStart: 5001,
      depthEnd: 5001.5,
      curveMnemonic: "GR",
      anomalyType: "MISSING_DATA",
      severity: "HIGH",
      description: "Sensor drop out",
    },
  ];

  it("renders depth samples, headers, and flags null values", () => {
    render(
      <WellLogDataTable
        wellName="Demo Well A"
        depthUnit="FT"
        curvesData={mockCurvesData}
        anomalies={mockAnomalies}
      />
    );

    expect(screen.getByText(/Well Log Numerical Spreadsheet/i)).toBeInTheDocument();
    expect(screen.getByText(/5 Samples/i)).toBeInTheDocument();
    expect(screen.getByText("5000.00")).toBeInTheDocument();
    expect(screen.getByText("45.20")).toBeInTheDocument();
    // One null value (-999.25) should render a NULL badge
    expect(screen.getByText("NULL")).toBeInTheDocument();
  });

  it("handles jump to depth input", () => {
    render(
      <WellLogDataTable
        wellName="Demo Well A"
        depthUnit="FT"
        curvesData={mockCurvesData}
      />
    );

    const input = screen.getByPlaceholderText(/Depth \(FT\)\.\.\./i);
    fireEvent.change(input, { target: { value: "5002" } });
    const jumpBtn = screen.getByRole("button", { name: /Jump/i });
    fireEvent.click(jumpBtn);

    expect(screen.getByText("5002.00")).toBeInTheDocument();
  });

  it("filters to rows with nulls when Nulls filter is clicked", () => {
    render(
      <WellLogDataTable
        wellName="Demo Well A"
        depthUnit="FT"
        curvesData={mockCurvesData}
        anomalies={mockAnomalies}
      />
    );

    const nullsBtn = screen.getByRole("button", { name: /Nulls/i });
    fireEvent.click(nullsBtn);

    // Only depth 5001 has the null value
    expect(screen.getByText("5001.00")).toBeInTheDocument();
    expect(screen.queryByText("5000.00")).not.toBeInTheDocument();
  });
});

describe("WellLogViewer Layout Switcher", () => {
  const mockCurvesData = {
    depth: [4000, 4001, 4002],
    curves: {
      GR: [50, 60, 70],
      RT: [10, 12, 14],
      DT: [80, 82, 81],
    },
  };

  it("renders layout switcher and toggles between Graph, Split, and Table views", () => {
    render(
      <WellLogViewer
        wellName="Explorer-01"
        depthUnit="FT"
        startDepth={4000}
        stopDepth={4002}
        curvesData={mockCurvesData}
      />
    );

    // Initial view is GRAPH: Log Plot
    expect(screen.getByRole("button", { name: /Log Plot/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Split View/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Data Table/i })).toBeInTheDocument();
    expect(screen.getByText(/BOREHOLE LOG: Explorer-01/i)).toBeInTheDocument();

    // Click Data Table
    fireEvent.click(screen.getByRole("button", { name: /Data Table/i }));
    expect(screen.getByText(/Well Log Numerical Spreadsheet/i)).toBeInTheDocument();
    expect(screen.queryByText(/BOREHOLE LOG: Explorer-01/i)).not.toBeInTheDocument();

    // Click Split View
    fireEvent.click(screen.getByRole("button", { name: /Split View/i }));
    expect(screen.getByText(/Wireline Curves Track/i)).toBeInTheDocument();
    expect(screen.getByText(/Synchronized Tabular Sheet/i)).toBeInTheDocument();
    expect(screen.getByText(/BOREHOLE LOG: Explorer-01/i)).toBeInTheDocument();
    expect(screen.getByText(/Well Log Numerical Spreadsheet/i)).toBeInTheDocument();
  });

  it("renders resistivity on a logarithmic scale and gamma ray / sonic on a linear scale", () => {
    render(
      <WellLogViewer
        wellName="Explorer-01"
        depthUnit="FT"
        startDepth={4000}
        stopDepth={4002}
        curvesData={mockCurvesData}
      />
    );

    // Track 2 header indicates logarithmic scale
    expect(screen.getByText(/RESISTIVITY \(LOG\)/i)).toBeInTheDocument();
    expect(screen.getByText(/RT \(ohm\.m\) — Logarithmic Scale/i)).toBeInTheDocument();

    // Decade ticks for logarithmic scale
    expect(screen.getByText("0.2")).toBeInTheDocument();
    expect(screen.getByText("2000")).toBeInTheDocument();

    // Track 1 (Gamma Ray) and Track 3 (Sonic) linear headers
    expect(screen.getByText(/GAMMA RAY/i)).toBeInTheDocument();
    expect(screen.getByText(/GR \(GAPI\)/i)).toBeInTheDocument();
    expect(screen.getByText(/SONIC/i)).toBeInTheDocument();
    expect(screen.getByText(/DT \(µs\/ft\)/i)).toBeInTheDocument();
  });
});
