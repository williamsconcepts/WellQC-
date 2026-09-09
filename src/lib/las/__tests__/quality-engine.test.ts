import { parseLASContent } from "../parser";
import { analyzeWellLogQuality } from "../quality-engine";

describe("Well Log Quality Engine Suite", () => {
  it("should calculate high quality score for clean valid well log", () => {
    const cleanLas = `
~VERSION INFORMATION
 VERS . 2.0 : CWLS LOG ASCII STANDARD
 WRAP . NO : ONE LINE PER DEPTH STEP
~WELL INFORMATION
 STRT .FT 1000.000 : START DEPTH
 STOP .FT 1002.000 : STOP DEPTH
 STEP .FT    0.500 : STEP DEPTH
 NULL .   -999.250 : NULL VALUE
 WELL . WELL-CLEAN : WELL NAME
~CURVE INFORMATION
 DEPT .FT   : DEPTH
 GR   .GAPI : GAMMA RAY
 RHOB .G/CC : DENSITY
 NPHI .V/V  : NEUTRON POROSITY
 DT   .US/F : SONIC DELTA T
 RT   .OHMM : RESISTIVITY
~ASCII LOG DATA
 1000.0   45.2   2.45   0.15   65.0   12.5
 1000.5   48.1   2.48   0.16   66.2   13.0
 1001.0   50.3   2.50   0.17   67.1   14.2
 1001.5   52.0   2.51   0.18   68.0   15.0
 1002.0   55.4   2.53   0.19   69.2   16.1
`.trim();

    const parsed = parseLASContent(cleanLas);
    const result = analyzeWellLogQuality(parsed);

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.qualityGrade).toBe("EXCELLENT");
    expect(result.anomalyCount).toBe(0);
  });

  it("should detect null clusters and impossible curve values", () => {
    const dirtyLas = `
~VERSION INFORMATION
 VERS . 2.0 : CWLS LOG ASCII STANDARD
 WRAP . NO : ONE LINE PER DEPTH STEP
~WELL INFORMATION
 STRT .FT 1000.000 : START DEPTH
 STOP .FT 1003.000 : STOP DEPTH
 STEP .FT    0.500 : STEP DEPTH
 NULL .   -999.250 : NULL VALUE
 WELL . WELL-DIRTY : WELL NAME
~CURVE INFORMATION
 DEPT .FT   : DEPTH
 RHOB .G/CC : DENSITY
~ASCII LOG DATA
 1000.0   2.45
 1000.5  -999.25
 1001.0  -999.25
 1001.5  -999.25
 1002.0  -999.25
 1002.5   15.80
 1003.0   2.50
`.trim();

    const parsed = parseLASContent(dirtyLas);
    const result = analyzeWellLogQuality(parsed);

    expect(result.overallScore).toBeLessThan(80);
    expect(result.anomalies.length).toBeGreaterThan(0);

    const hasNullCluster = result.anomalies.some((a) => a.anomalyType === "NULL_CLUSTER");
    const hasImpossible = result.anomalies.some((a) => a.anomalyType === "IMPOSSIBLE_VALUE");

    expect(hasNullCluster || hasImpossible).toBe(true);
  });
});
