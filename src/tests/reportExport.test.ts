import { describe, expect, it } from "vitest";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";
import { createMarkdownReport } from "../core/report-export/markdownReport";
import { createTranslator } from "../i18n/i18n";

describe("markdown report export", () => {
  it("includes score, recommendations, passed checks, and suggestions", () => {
    const analysis = analyzeQuery(
      "SELECT * FROM users WHERE LOWER(email) = 'a@example.com' ORDER BY created_at DESC;",
    );
    const report = createMarkdownReport({
      analysis,
      language: "en",
      t: createTranslator("en"),
    });

    expect(report).toContain("SQL Atlas Optimization Report");
    expect(report).toContain("Query score");
    expect(report).toContain("Top recommendations");
    expect(report).toContain("Passed checks");
    expect(report).toContain("Suggested indexes");
    expect(report).toContain("Avoid SELECT *");
  });
});
