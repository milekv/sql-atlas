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
});
