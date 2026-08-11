import { describe, expect, it } from "vitest";
import { parsePostgresExplainJson } from "../core/explain/parsePostgresExplainJson";
import { sampleExplainJson } from "../core/explain/samplePlan";

describe("parsePostgresExplainJson", () => {
  it("normalizes a PostgreSQL JSON plan and calculates its summary", () => {
    const result = parsePostgresExplainJson(sampleExplainJson);

    expect(result.root.nodeType).toBe("Nested Loop");
    expect(result.root.children).toHaveLength(2);
    expect(result.summary.nodeCount).toBe(3);
    expect(result.summary.executionTime).toBe(94.13);
    expect(result.summary.sharedReadBlocks).toBe(414);
  });

  it("detects row estimate, sequential scan, and filtering risks", () => {
    const result = parsePostgresExplainJson(sampleExplainJson);
    const riskCodes = result.risks.map((risk) => risk.code);

    expect(riskCodes).toContain("large-seq-scan");
    expect(riskCodes).toContain("estimate-mismatch");
    expect(riskCodes).toContain("filter-waste");
  });

  it("accepts an unwrapped plan node", () => {
    const result = parsePostgresExplainJson('{"Node Type":"Result","Plan Rows":1}');
    expect(result.root.nodeType).toBe("Result");
    expect(result.summary.nodeCount).toBe(1);
  });

  it("rejects malformed input", () => {
    expect(() => parsePostgresExplainJson("not-json")).toThrow("Invalid JSON");
    expect(() => parsePostgresExplainJson("{}")) .toThrow("Node Type");
  });
});
