import { parseLASContent } from "../parser";
import { analyzeWellLogQuality } from "../quality-engine";
import { cleanLASLogData } from "../cleaner";

describe("Enterprise LAS Data Cleaning & Verification Engine Suite", () => {
  const dirtyLasContent = `
~VERSION INFORMATION
 VERS . 2.0 : CWLS LOG ASCII STANDARD
 WRAP . NO : ONE LINE PER DEPTH STEP
~WELL INFORMATION
 STRT .FT 5000.000 : START DEPTH
 STOP .FT 5004.000 : STOP DEPTH
 STEP .FT    0.500 : STEP DEPTH
 NULL .   -999.250 : NULL VALUE
 WELL . WELL-DIRTY-TEST : WELL NAME
 COMP . NIGERIA PETRO : COMPANY
 FLD  . NIGER DELTA : FIELD
~CURVE INFORMATION
 DEPT .FT       : MEASURED DEPTH
 GAMMA.GAPI     : RAW GAMMA RAY WITH SPIKE
 DEN  .KGM3     : BULK DENSITY IN KG/M3
 NPHI .PERCENT  : NEUTRON POROSITY IN PERCENT
 DT   .US/F     : SONIC TRANSIT TIME WITH NULL GAP
 RT   .OHMM     : RESISTIVITY
~ASCII LOG DATA
 5000.0   45.2   2450.0   15.0   65.0   12.5
 5000.5   48.1   2480.0   16.0  -999.25 13.0
 5001.0  145.0   9999.0   17.0  -999.25 14.2
 5001.0   50.3   2500.0   17.0  -999.25 14.2
 5001.5   52.0   2510.0   18.0   68.0   15.0
 5002.0   55.4   2530.0   19.0   69.2   16.1
 5002.5   57.0   2540.0   20.0   70.5   17.0
 5003.0   59.2   2550.0   21.0   71.8   18.2
 5003.5   61.0   2560.0   22.0   72.9   19.0
 5004.0   63.5   2570.0   23.0   74.1   20.0
`.trim();

  it("should detect anomalies in raw dirty LAS and clean them thoroughly", () => {
    const rawParsed = parseLASContent(dirtyLasContent);
    const rawQa = analyzeWellLogQuality(rawParsed);

    expect(rawQa.overallScore).toBeLessThan(90);

    // Execute Automated Cleaning Engine
    const result = cleanLASLogData(rawParsed, rawQa, {
      despiking: true,
      outlierClipping: true,
      unitStandardization: true,
      duplicateDepthPruning: true,
      imputationStrategy: "KNN",
    });

    const report = result.verificationReport;

    // Verify cleaning metrics
    expect(report.duplicateDepthsPrunedCount).toBe(1); // Duplicate depth 5001.0 pruned
    expect(report.spikesDespikedCount).toBeGreaterThanOrEqual(1); // 999.00 spike despiked
    expect(report.unitsConvertedCount).toBeGreaterThan(0); // DEN (kg/m3 -> g/cc) & NPHI (% -> decimal)
    expect(report.nullsImputedCount).toBeGreaterThan(0); // DT null gap imputed
    expect(report.cleanedQualityScore).toBeGreaterThan(report.originalQualityScore);
    expect(report.isVerifiedClean).toBe(true);

    // Verify cleaned curve mnemonics & units
    const cleanedCurves = result.cleanedLas.curves.map((c) => ({ mnem: c.mnemonic, unit: c.unit }));
    expect(cleanedCurves).toContainEqual({ mnem: "GR", unit: "GAPI" });
    expect(cleanedCurves).toContainEqual({ mnem: "RHOB", unit: "G/CC" });
    expect(cleanedCurves).toContainEqual({ mnem: "NPHI", unit: "V/V" });

    // Verify density values converted from kg/m3 to g/cc (e.g. 2450 -> ~2.45)
    const rhobValues = result.cleanedLas.data.curves["RHOB"];
    expect(rhobValues[0]).toBeCloseTo(2.45, 2);

    // Verify neutron porosity converted from % to decimal (e.g. 15.0% -> 0.15)
    const nphiValues = result.cleanedLas.data.curves["NPHI"];
    expect(nphiValues[0]).toBeCloseTo(0.15, 2);

    // Verify output text files generated
    expect(result.cleanedLasText).toContain("Cleaned & Repaired by WellQC+ Enterprise Engine");
    expect(result.cleanedCsvText).toContain("GR,RHOB,NPHI,DT,RT");
  });
});
