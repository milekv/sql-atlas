import { describe, expect, it } from "vitest";
import {
  findFragmentOffset,
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
});
