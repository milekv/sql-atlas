import { describe, expect, it } from "vitest";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";
import { toEditorMarkers } from "../components/editor/editorDiagnostics";

describe("Monaco source diagnostics", () => {
  it("maps repeated problems to their own columns and skips a comment match", () => {
    const sql = "-- LOWER(email)\nSELECT id FROM users WHERE LOWER(email) = 'a' AND LOWER(name) = 'b';";
    const markers = toEditorMarkers(sql, analyzeQuery(sql).findings, (key) => key);
    expect(markers.filter((marker) => marker.code === "function-in-where")
      .map(({ startLineNumber, startColumn }) => [startLineNumber, startColumn]))
      .toEqual([[2, 28], [2, 51]]);
  });

  it("clears stale markers after the SQL is edited", () => {
    const result = analyzeQuery("DELETE FROM users;");
    expect(toEditorMarkers("SELECT id FROM users;", result.findings, (key) => key, result.sql)).toEqual([]);
  });
});
