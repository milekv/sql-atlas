import { describe, expect, it } from "vitest";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";

describe("dialect and scope regressions", () => {
  it("finds a T-SQL CTE DELETE even when its CTE has its own WHERE", () => {
    const sql = "WITH old_rows AS (SELECT id FROM dbo.Users WHERE inactive = 1) DELETE FROM dbo.Logs;";
    const finding = analyzeQuery(sql, "sqlserver").findings.find((item) => item.id === "delete-without-where");
    expect(finding?.location?.start).toBe(sql.indexOf("DELETE"));
  });
  it("does not flag a PostgreSQL CTE DELETE with an outer WHERE", () => {
    const sql = "WITH old_rows AS (SELECT id FROM users) DELETE FROM logs WHERE id IN (SELECT id FROM old_rows);";
    expect(analyzeQuery(sql, "postgresql").findings.map((item) => item.id)).not.toContain("delete-without-where");
  });
  it("keeps string and bracketed identifiers from creating a CTE action", () => {
    const sql = "WITH c AS (SELECT '[DELETE FROM logs]' AS note) SELECT note FROM c;";
    expect(analyzeQuery(sql, "sqlserver").findings.map((item) => item.id)).not.toContain("delete-without-where");
  });
});
