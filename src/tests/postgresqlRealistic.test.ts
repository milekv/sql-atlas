import { describe, expect, it } from "vitest";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";
import { createAnalyzerContext } from "../core/analyzer/analyzerUtils";

describe("realistic PostgreSQL parsing", () => {
  it("does not split PL/pgSQL function bodies at internal semicolons", () => {
    const sql = `
      CREATE FUNCTION refresh_customer() RETURNS trigger AS $body$
      BEGIN
        UPDATE customers SET refreshed_at = now();
        RETURN NEW;
      END;
      $body$ LANGUAGE plpgsql;
      SELECT id FROM customers WHERE active = true LIMIT 20;
    `;
    const context = createAnalyzerContext(sql, "postgresql");
    expect(context.statements).toHaveLength(2);
    expect(analyzeQuery(sql).findings.map((finding) => finding.id)).not.toContain(
      "update-without-where",
    );
  });

  it("ignores SQL keywords inside strings and nested comments", () => {
    const sql = `
      /* migration note /* DELETE FROM users; */ still a comment */
      SELECT id, 'JOIN orders ORDER BY created_at' AS note
      FROM audit_log
      WHERE id = 1
      LIMIT 1;
    `;
    const ids = analyzeQuery(sql).findings.map((finding) => finding.id);
    expect(ids).not.toContain("delete-without-where");
    expect(ids).not.toContain("missing-join-condition");
    expect(ids).not.toContain("order-by-without-limit");
  });

  it("handles escaped PostgreSQL string literals without leaking keywords", () => {
    const sql = `SELECT id FROM logs WHERE message = 'it''s a JOIN without ON' LIMIT 10;`;
    expect(analyzeQuery(sql).findings.map((finding) => finding.id)).not.toContain(
      "missing-join-condition",
    );
  });

  it("accepts a PostgreSQL NATURAL JOIN as an intentional join condition", () => {
    const sql = "SELECT customer_id FROM customers NATURAL JOIN accounts LIMIT 10;";
    expect(analyzeQuery(sql).findings.map((finding) => finding.id)).not.toContain(
      "missing-join-condition",
    );
  });

  it("does not count commas inside GROUP BY functions as separate columns", () => {
    const sql = `
      SELECT coalesce(region, 'unknown'), channel, count(*)
      FROM events
      GROUP BY coalesce(region, 'unknown'), channel;
    `;
    expect(analyzeQuery(sql).findings.map((finding) => finding.id)).not.toContain(
      "group-by-many-columns",
    );
  });
});
