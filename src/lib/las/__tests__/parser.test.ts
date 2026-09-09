import { parseLASContent } from "../parser";
import { standardiseMnemonic } from "../standardiser";

describe("LAS Parser & Standardiser Suite", () => {
  const sampleLas = `
~VERSION INFORMATION
 VERS .                  2.0 : CWLS LOG ASCII STANDARD - VERSION 2.0
 WRAP .                   NO : ONE LINE PER DEPTH STEP
~WELL INFORMATION
 STRT .FT               1000.000 : START DEPTH
 STOP .FT               1010.000 : STOP DEPTH
 STEP .FT                  0.500 : STEP DEPTH
 NULL .                 -999.250 : NULL VALUE
 WELL .                  WELL-001 : WELL NAME
 COMP .                  ACME ENERGY : COMPANY NAME
 FLD  .                  NORTH SEA : FIELD
 API  .                  42-123-45678 : API NUMBER
~CURVE INFORMATION
 DEPT .FT                        : MEASURED DEPTH
 GR   .GAPI                      : GAMMA RAY
 RHOB .G/CC                      : BULK DENSITY
~ASCII LOG DATA
 1000.0   45.2   2.45
 1000.5   48.1   2.48
 1001.0 -999.25  2.50
 1001.5   52.0 -999.25
 1002.0   55.4   2.53
`.trim();

  it("should parse LAS header well metadata correctly", () => {
    const parsed = parseLASContent(sampleLas);

    expect(parsed.wellInfo.wellName).toBe("WELL-001");
    expect(parsed.wellInfo.company).toBe("ACME ENERGY");
    expect(parsed.wellInfo.field).toBe("NORTH SEA");
    expect(parsed.wellInfo.apiUwi).toBe("42-123-45678");
    expect(parsed.wellInfo.startDepth).toBe(1000.0);
    expect(parsed.wellInfo.stopDepth).toBe(1010.0);
    expect(parsed.wellInfo.nullValue).toBe(-999.25);
  });

  it("should parse curves and log data points correctly", () => {
    const parsed = parseLASContent(sampleLas);

    expect(parsed.curves).toHaveLength(3);
    expect(parsed.curves.map((c) => c.mnemonic)).toEqual(["DEPT", "GR", "RHOB"]);
    expect(parsed.data.depth).toHaveLength(5);
    expect(parsed.data.depth[0]).toBe(1000.0);
    expect(parsed.data.curves["GR"][0]).toBe(45.2);
    expect(parsed.data.curves["GR"][2]).toBe(-999.25);
  });

  it("should standardise petrophysical curve mnemonics", () => {
    const grResult = standardiseMnemonic("GR", "GAPI");
    expect(grResult.standardMnemonic).toBe("GR");
    expect(grResult.confidence).toBe(1.0);
    expect(grResult.unitMismatch).toBe(false);

    const aliasResult = standardiseMnemonic("GAMMA", "GAPI");
    expect(aliasResult.standardMnemonic).toBe("GR");
    expect(aliasResult.confidence).toBeGreaterThanOrEqual(0.8);

    const unknownResult = standardiseMnemonic("CUSTOM_LOG", "RPM");
    expect(unknownResult.standardMnemonic).toBe("CUSTOM_LOG");
    expect(unknownResult.isAutoMatched).toBe(false);
  });
});
