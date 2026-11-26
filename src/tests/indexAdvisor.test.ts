import { describe, expect, it } from "vitest";
import { suggestIndexes } from "../core/index-advisor/suggestIndexes";

describe("index advisor", () => {
  it("suggests indexes for WHERE and JOIN columns", () => {
    const suggestions = suggestIndexes(`
      SELECT o.id, c.email
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE c.email = :email
      ORDER BY o.created_at DESC
    `);

    const snippets = suggestions.map((suggestion) => suggestion.sqlSnippet);
    expect(snippets.join("\n")).toContain("customers (email)");
    expect(snippets.join("\n")).toContain("orders (customer_id)");
    expect(snippets.join("\n")).toContain("orders (created_at)");
  });

  it("suggests functional indexes for function filters", () => {
    const suggestions = suggestIndexes(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(:email);",
    );

    expect(suggestions.map((suggestion) => suggestion.sqlSnippet).join("\n")).toContain(
      "LOWER(email)",
    );
  });

  it("suggests composite candidates for WHERE plus ORDER BY", () => {
    const suggestions = suggestIndexes(
      "SELECT id FROM orders WHERE status = 'paid' ORDER BY created_at DESC;",
    );

    expect(suggestions.map((suggestion) => suggestion.sqlSnippet).join("\n")).toContain(
      "orders (status, created_at)",
    );
  });

  it("does not combine index columns across SQL statements", () => {
    const suggestions = suggestIndexes(`
      SELECT id FROM audit_log ORDER BY created_at DESC;
      SELECT id FROM users ORDER BY created_at DESC LIMIT 20;
    `);

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tableName: "audit_log", columns: ["created_at"] }),
        expect.objectContaining({ tableName: "users", columns: ["created_at"] }),
      ]),
    );
    expect(suggestions.every((suggestion) =>
      suggestion.columns.every((column) => !column.includes("select")),
    )).toBe(true);
  });

  it("does not propose indexes for literal text, unknown aliases or ambiguous unqualified columns", () => {
    const suggestions = suggestIndexes(`SELECT a.id FROM accounts a JOIN orders o ON o.account_id = a.id
      WHERE 'WHERE fake = 1' = a.status AND a.status = 'open' AND missing.region = 1 AND status = 'open'
      /* WHERE comment_column = 1 */`);
    expect(suggestions.some((item) => item.tableName === "missing" || item.columns.includes("fake") ||
      item.columns.includes("comment_column") || item.columns.includes("status") && item.tableName === "orders")).toBe(false);
    expect(suggestions.some((item) => item.columns.includes("region"))).toBe(false);
    expect(suggestions.some((item) => item.tableName === "accounts" && item.columns.includes("status"))).toBe(true);
  });

  it("does not generate CREATE INDEX for a CTE name or columns outside the filter", () => {
    const suggestions = suggestIndexes(`WITH recent AS (SELECT id, created_at FROM orders WHERE status = 'paid')
      SELECT LOWER(label) FROM recent WHERE id = 10`);
    expect(suggestions.some((item) => item.tableName === "recent")).toBe(false);
    expect(suggestions.some((item) => item.expression === "LOWER(label)")).toBe(false);
  });

  it("does not emit PostgreSQL index DDL for other SQL dialects", () => {
    expect(suggestIndexes("SELECT * FROM users WHERE email = :email", "oracle")).toEqual([]);
    expect(suggestIndexes("SELECT * FROM dbo.Users WHERE email = @email", "sqlserver")).toEqual([]);
  });

  it("does not change a schema-qualified table into a different table name", () => {
    expect(suggestIndexes("SELECT id FROM reporting.events WHERE occurred_at > now()")).toEqual([]);
  });
});
