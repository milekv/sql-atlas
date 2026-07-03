import { describe, expect, it } from "vitest";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";
import {
  createBeforeAfterRewrite,
  createOptimizationStory,
  extractQueryMap,
} from "../core/analyzer/experience";

describe("premium analyzer experience", () => {
  it("generates optimization story steps from findings", () => {
    const analysis = analyzeQuery("DELETE FROM sessions; SELECT * FROM customers;");

    expect(analysis.optimizationStory.steps.length).toBeGreaterThanOrEqual(2);
    expect(analysis.optimizationStory.steps[0]).toMatchObject({
      issueId: "delete-without-where",
      severity: "critical",
      stepNumber: 1,
    });
  });

  it("can build optimization story directly from issues", () => {
    const analysis = analyzeQuery(
      "SELECT * FROM customers WHERE LOWER(email) = LOWER(:email);",
    );
    const story = createOptimizationStory(analysis.findings);

    expect(story.steps.map((step) => step.issueId)).toContain("select-star");
    expect(story.steps.map((step) => step.issueId)).toContain("function-in-where");
  });

  it("before/after rewrite handles SELECT star with placeholder columns", () => {
    const analysis = analyzeQuery("SELECT *\nFROM customers\nWHERE id = 1;");
    const rewrite = createBeforeAfterRewrite(analysis.sql, analysis.findings);

    expect(rewrite.status).toBe("available");
    expect(rewrite.suggestedSql).toContain("SELECT id, column_name");
    expect(rewrite.notes).toContain("analyzer.beforeAfter.note.selectStarPlaceholder");
  });

  it("before/after rewrite handles ORDER BY without LIMIT", () => {
    const analysis = analyzeQuery(
      "SELECT id\nFROM events\nORDER BY created_at DESC;",
    );
    const rewrite = createBeforeAfterRewrite(analysis.sql, analysis.findings);

    expect(rewrite.status).toBe("available");
    expect(rewrite.suggestedSql).toContain("LIMIT 100");
    expect(rewrite.notes).toContain("analyzer.beforeAfter.note.limitExample");
  });

  it("before/after does not create unsafe DELETE rewrite", () => {
    const analysis = analyzeQuery("DELETE FROM sessions;");
    const rewrite = createBeforeAfterRewrite(analysis.sql, analysis.findings);

    expect(rewrite.status).toBe("unsafe-blocked");
    expect(rewrite.suggestedSql).toBeUndefined();
    expect(rewrite.warningKey).toBe("analyzer.beforeAfter.warning.delete");
  });

  it("query map extracts SELECT", () => {
    const sections = extractQueryMap("SELECT id, email FROM customers;");

    expect(sections.find((section) => section.clause === "select")?.fragment).toBe(
      "SELECT id, email",
    );
  });

  it("query map extracts WHERE", () => {
    const sections = extractQueryMap(
      "SELECT id FROM customers WHERE LOWER(email) = LOWER(:email);",
    );

    expect(sections.find((section) => section.clause === "where")?.fragment).toBe(
      "WHERE LOWER(email) = LOWER(:email)",
    );
  });

  it("query map extracts ORDER BY", () => {
    const sections = extractQueryMap(
      "SELECT id FROM events WHERE tenant_id = 1 ORDER BY created_at DESC;",
    );

    expect(sections.find((section) => section.clause === "order-by")?.fragment).toBe(
      "ORDER BY created_at DESC",
    );
  });

  it("query map handles missing clauses safely", () => {
    expect(extractQueryMap("VACUUM;")).toEqual([]);
  });
});
