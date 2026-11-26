import { describe, expect, it } from "vitest";
import {
  diagnosticSummary,
  findFragmentOffset,
  resolveExtensionLanguage,
  shouldShowSeverity,
} from "../vscode/diagnosticUtils";

describe("VS Code diagnostic helpers", () => {
  it("finds a detected SQL fragment without depending on case", () => {
    expect(findFragmentOffset("SELECT id\nFROM users", "from users")).toBe(10);
  });

  it("falls back to the beginning when a fragment is unavailable", () => {
    expect(findFragmentOffset("SELECT 1", "missing")).toBe(0);
    expect(findFragmentOffset("SELECT 1")).toBe(0);
  });

  it("filters diagnostics by the configured minimum severity", () => {
    expect(shouldShowSeverity("critical", "warning")).toBe(true);
    expect(shouldShowSeverity("warning", "warning")).toBe(true);
    expect(shouldShowSeverity("info", "warning")).toBe(false);
  });

  it("explains the result in plain language", () => {
    expect(diagnosticSummary(0, 0, 0)).toBe("SQL Atlas: no issues");
    expect(diagnosticSummary(1, 2, 0)).toBe("SQL Atlas: 1 critical, 2 warnings");
    expect(diagnosticSummary(1, 2, 0, "pl")).toBe("SQL Atlas: 1 krytyczny, 2 ostrzeżenia");
  });

  it("uses the editor language unless the user chooses English or Polish", () => {
    expect(resolveExtensionLanguage("auto", "pl-PL")).toBe("pl");
    expect(resolveExtensionLanguage("auto", "en-US")).toBe("en");
    expect(resolveExtensionLanguage("en", "pl-PL")).toBe("en");
    expect(resolveExtensionLanguage("pl", "en-US")).toBe("pl");
  });
});
