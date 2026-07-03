import { describe, expect, it } from "vitest";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";
import type { RuleId } from "../core/analyzer/types";
import { analyzerRules } from "../core/analyzer/rules";

const expectRule = (sql: string, ruleId: RuleId) => {
  const result = analyzeQuery(sql);
  expect(result.findings.map((finding) => finding.id)).toContain(ruleId);
};

describe("SQL analyzer rules", () => {
  it("registers the professional analyzer rule set", () => {
    expect(analyzerRules).toHaveLength(20);
  });

  it("detects SELECT *", () => {
    expectRule("SELECT * FROM customers;", "select-star");
  });

  it("does not treat SELECT count(*) as SELECT *", () => {
    const result = analyzeQuery("SELECT count(*) FROM customers;");
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "select-star",
    );
  });

  it("detects UPDATE without WHERE", () => {
    expectRule("UPDATE users SET active = false;", "update-without-where");
  });

  it("passes UPDATE with WHERE", () => {
    const result = analyzeQuery("UPDATE users SET active = false WHERE id = 1;");
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "update-without-where",
    );
    expect(result.passedChecks.map((check) => check.id)).toContain(
      "update-without-where",
    );
  });

  it("detects DELETE without WHERE", () => {
    expectRule("DELETE FROM sessions;", "delete-without-where");
  });

  it("passes DELETE with WHERE", () => {
    const result = analyzeQuery("DELETE FROM sessions WHERE expires_at < NOW();");
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "delete-without-where",
    );
    expect(result.passedChecks.map((check) => check.id)).toContain(
      "delete-without-where",
    );
  });

  it("detects leading wildcard LIKE", () => {
    expectRule(
      "SELECT id FROM articles WHERE title LIKE '%database%';",
      "leading-wildcard-like",
    );
  });

  it("does not warn on prefix LIKE", () => {
    const result = analyzeQuery("SELECT id FROM articles WHERE title LIKE 'database%';");
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "leading-wildcard-like",
    );
  });

  it("detects functions on columns in WHERE", () => {
    expectRule(
      "SELECT id FROM users WHERE LOWER(email) = 'a@example.com';",
      "function-in-where",
    );
  });

  it("detects ORDER BY without LIMIT", () => {
    expectRule(
      "SELECT id FROM events ORDER BY created_at DESC;",
      "order-by-without-limit",
    );
  });

  it("passes ORDER BY with LIMIT", () => {
    const result = analyzeQuery(
      "SELECT id FROM events ORDER BY created_at DESC LIMIT 20;",
    );
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "order-by-without-limit",
    );
  });

  it("detects OFFSET pagination", () => {
    expectRule(
      "SELECT id FROM audit_log ORDER BY created_at DESC LIMIT 50 OFFSET 5000;",
      "offset-pagination",
    );
  });

  it("detects long OR chains", () => {
    expectRule(
      "SELECT id FROM tasks WHERE status = 'open' OR status = 'queued' OR status = 'held' OR status = 'pending';",
      "too-many-or-conditions",
    );
  });

  it("detects CROSS JOIN", () => {
    expectRule("SELECT * FROM products CROSS JOIN stores;", "cross-join");
  });

  it("detects missing join conditions", () => {
    expectRule("SELECT * FROM orders, customers;", "missing-join-condition");
  });

  it("detects DISTINCT overuse", () => {
    expectRule("SELECT DISTINCT customer_id FROM orders;", "distinct-overuse");
  });

  it("detects GROUP BY with many columns", () => {
    expectRule(
      "SELECT a, b, c, d, COUNT(*) FROM events GROUP BY a, b, c, d;",
      "group-by-many-columns",
    );
  });

  it("detects NOT IN NULL risk", () => {
    expectRule(
      "SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM bans);",
      "not-in-null-risk",
    );
  });

  it("detects implicit conversion risk", () => {
    expectRule(
      "SELECT id FROM customers WHERE customer_id = '42';",
      "implicit-conversion-risk",
    );
  });

  it("detects unbounded SELECT", () => {
    expectRule("SELECT id, email FROM users;", "unbounded-select");
  });

  it("detects many JOINs", () => {
    expectRule(
      "SELECT * FROM a JOIN b ON b.a_id = a.id JOIN c ON c.b_id = b.id JOIN d ON d.c_id = c.id JOIN e ON e.d_id = d.id JOIN f ON f.e_id = e.id;",
      "too-many-joins",
    );
  });

  it("detects possible N+1 query shape", () => {
    expectRule(
      "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC LIMIT 1;",
      "possible-n-plus-one-pattern",
    );
  });

  it("detects random sorting", () => {
    expectRule("SELECT id FROM products ORDER BY random() LIMIT 1;", "order-by-random");
  });

  it("detects destructive DROP TABLE", () => {
    expectRule("DROP TABLE users;", "unsafe-drop-table");
  });

  it("returns passed checks when rules do not trigger", () => {
    const result = analyzeQuery("SELECT id FROM users WHERE id = 1 LIMIT 1;");
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "select-star",
    );
    expect(result.passedChecks.map((check) => check.id)).toContain("select-star");
  });
});
