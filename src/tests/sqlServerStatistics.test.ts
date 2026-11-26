import { describe, expect, it } from "vitest";
import { parseSqlServerStatistics } from "../core/explain/parseSqlServerStatistics";

describe("SQL Server STATISTICS IO/TIME messages", () => {
  it("preserves multiple table readings and compile/execution timings", () => {
    const result = parseSqlServerStatistics(`SQL Server parse and compile time:\n   CPU time = 2 ms, elapsed time = 3 ms.\nTable 'Orders'. Scan count 1, logical reads 76, physical reads 0, page server reads 0, read-ahead reads 4, lob logical reads 2.\nTable 'Worktable'. Scan count 0, logical reads 18, physical reads 0.\nSQL Server Execution Times:\n   CPU time = 15 ms, elapsed time = 27 ms.`);
    expect(result.io).toEqual([
      { table: "Orders", scanCount: 1, logicalReads: 76, physicalReads: 0, pageServerReads: 0, readAheadReads: 4, lobLogicalReads: 2 },
      { table: "Worktable", scanCount: 0, logicalReads: 18, physicalReads: 0, pageServerReads: undefined, readAheadReads: undefined, lobLogicalReads: undefined },
    ]);
    expect(result.time).toEqual([{ phase: "compile", cpuMs: 2, elapsedMs: 3 }, { phase: "execution", cpuMs: 15, elapsedMs: 27 }]);
  });

  it("returns no invented metrics for unrelated messages", () => {
    expect(parseSqlServerStatistics("(10 rows affected)\nWarning: Null value is eliminated.")).toEqual({ io: [], time: [] });
  });
});
