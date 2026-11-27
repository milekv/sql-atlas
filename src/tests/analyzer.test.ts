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

  it("reports every unsafe statement at the original keyword, ignoring comments", () => {
    const sql = "-- DELETE FROM accounts;\nDELETE FROM sessions;\nUPDATE users SET active = false;\nDELETE FROM logs;";
    const result = analyzeQuery(sql);
    expect(result.findings.filter((finding) => finding.id === "delete-without-where")
      .map((finding) => finding.location?.line)).toEqual([2, 4]);
    expect(result.findings.find((finding) => finding.id === "update-without-where")?.location?.line).toBe(3);
  });

  it("does not accept WHERE located only inside a subquery as a DELETE or UPDATE safeguard", () => {
    const sql = "DELETE FROM sessions USING (SELECT id FROM users WHERE active = false) old;\nUPDATE users SET active = (SELECT active FROM defaults WHERE id = 1);";
    const ids = analyzeQuery(sql).findings.map((finding) => finding.id);
    expect(ids).toContain("delete-without-where");
    expect(ids).toContain("update-without-where");
  });

  it("reports multiple SELECT stars but charges a rule once", () => {
    const single = analyzeQuery("SELECT * FROM a;");
    const multiple = analyzeQuery("SELECT * FROM a; SELECT * FROM b;");
    expect(multiple.findings.filter((finding) => finding.id === "select-star")).toHaveLength(2);
    expect(multiple.score).toBe(single.score);
  });

  it("reports repeated occurrences within one statement at distinct source offsets", () => {
    const sql = "SELECT * FROM users WHERE LOWER(email) = 'x' AND LOWER(name) = 'y' OR city LIKE '%a' OR country LIKE '%b' ORDER BY RANDOM(), RANDOM();";
    const findings = analyzeQuery(sql).findings;
    for (const id of ["function-in-where", "leading-wildcard-like", "order-by-random"] as const) {
      const hits = findings.filter((finding) => finding.id === id);
      expect(hits).toHaveLength(2);
      expect(hits[0]?.location?.start).toBeLessThan(hits[1]!.location!.start);
      expect(hits.map((hit) => sql.slice(hit.location!.start, hit.location!.end).toLowerCase()))
        .toEqual(hits.map((hit) => hit.detectedFragment!.toLowerCase()));
    }
  });

  it("does not match a LIKE token inside a quoted literal or comment", () => {
    const sql = "SELECT 'LIKE ''%fake''' AS txt /* LIKE '%comment' */ FROM users WHERE title LIKE '%real';";
    expect(analyzeQuery(sql).findings.filter((finding) => finding.id === "leading-wildcard-like")).toHaveLength(1);
  });

  it("keeps T-SQL GO batches separate and ignores bracket-quoted keywords", () => {
    const sql = "SELECT [DELETE; FROM x] FROM dbo.Users;\nGO\nDELETE FROM dbo.Logs;\nGO\nUPDATE dbo.Users SET [WHERE] = 1;";
    const result = analyzeQuery(sql, "sqlserver");
    expect(result.findings.filter((finding) => finding.id === "delete-without-where")
      .map((finding) => finding.location?.line)).toEqual([3]);
    expect(result.findings.filter((finding) => finding.id === "update-without-where")
      .map((finding) => finding.location?.line)).toEqual([5]);
  });

  it("ignores semicolons and keywords inside MySQL backtick identifiers", () => {
    const sql = "SELECT `DELETE; FROM fake` FROM users; DELETE FROM logs;";
    expect(analyzeQuery(sql, "mysql").findings.filter((finding) => finding.id === "delete-without-where")
      .map((finding) => finding.location?.start)).toEqual([sql.lastIndexOf("DELETE")]);
  });

  it("ignores PostgreSQL dollar-quoted function body during analysis", () => {
    const sql = "CREATE FUNCTION f() RETURNS text AS $body$ DELETE FROM users; $body$ LANGUAGE sql; SELECT id FROM users WHERE id = 1;";
    expect(analyzeQuery(sql).findings.map((finding) => finding.id)).not.toContain("delete-without-where");
  });

  it("locates EXTRACT in a compound WHERE expression", () => {
    const sql = "SELECT id FROM events\nWHERE status = 'open' AND EXTRACT(YEAR FROM created_at) = 2026 LIMIT 1;";
    const finding = analyzeQuery(sql).findings.find((item) => item.id === "function-in-where");
    expect(finding?.location).toMatchObject({ line: 2, column: 27 });
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
      "SELECT id FROM users WHERE status NOT IN ('active', NULL);",
      "not-in-null-risk",
    );
  });

  it("does not warn for a NOT IN literal list without NULL", () => {
    const result = analyzeQuery(
      "SELECT id FROM users WHERE status NOT IN ('active', 'pending');",
    );
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "not-in-null-risk",
    );
  });

  it("does not treat the string value NULL as a NULL token", () => {
    const result = analyzeQuery(
      "SELECT id FROM users WHERE status NOT IN ('NULL', 'active');",
    );
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "not-in-null-risk",
    );
  });

  it("does not report the generic NOT IN rule for a subquery", () => {
    const result = analyzeQuery(
      "SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM bans);",
    );
    expect(result.findings.map((finding) => finding.id)).not.toContain(
      "not-in-null-risk",
    );
    expect(result.findings.map((finding) => finding.id)).toContain(
      "nullable-not-in",
    );
  });

  it("detects implicit conversion risk", () => {
    const mysql = analyzeQuery(
      "SELECT id FROM customers WHERE customer_id = '42';",
      "mysql",
    );
    expect(mysql.findings.map((finding) => finding.id)).toContain(
      "implicit-conversion-risk",
    );
  });

  it("does not guess an implicit conversion for PostgreSQL unknown literals", () => {
    const result = analyzeQuery(
      "SELECT id FROM customers WHERE customer_id = '42';",
      "postgresql",
    );
    expect(result.findings.map((finding) => finding.id)).not.toContain(
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

  it("does not offer non-equivalent sampling or dialect-incompatible index DDL", () => {
    const pg = analyzeQuery("SELECT id FROM products ORDER BY random() LIMIT 1;", "postgresql");
    expect(pg.findings.find((finding) => finding.id === "order-by-random")?.suggestedSqlSnippet).toBeUndefined();
    const tsql = analyzeQuery("SELECT id FROM users WHERE LOWER(email) LIKE '%test';", "sqlserver");
    expect(tsql.findings.filter((finding) => ["leading-wildcard-like", "function-in-where"].includes(finding.id))
      .every((finding) => finding.suggestedSqlSnippet === undefined)).toBe(true);
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

  it("supports API and inline rule ignores without reporting disabled checks as passed", () => {
    const apiIgnored = analyzeQuery("SELECT * FROM customers;", "postgresql", {
      ignoreRules: ["select-star"],
    });
    expect(apiIgnored.findings.map((finding) => finding.id)).not.toContain("select-star");
    expect(apiIgnored.passedChecks.map((finding) => finding.id)).not.toContain("select-star");

    const inlineIgnored = analyzeQuery(
      "-- sql-atlas-ignore select-star, unbounded-select\nSELECT * FROM customers;",
    );
    expect(inlineIgnored.findings).toEqual([]);
  });
});
