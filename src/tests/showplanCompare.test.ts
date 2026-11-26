import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compareSqlServerPlans } from "../core/explain/compareSqlServerPlans";
import { parseSqlServerShowplan } from "../core/explain/parseSqlServerShowplan";

const plan = (name: string) => parseSqlServerShowplan(readFileSync(`${process.cwd()}/examples/plans/${name}`, "utf8"));

describe("Microsoft execution plan pair", () => {
  it("compares only observed structure and estimates without inventing speedups", () => {
    const comparison = compareSqlServerPlans(plan("microsoft-compare1-slow.sqlplan"), plan("microsoft-compare1-fast.sqlplan"));
    // The source demo labels these plans as a pair, but their QueryHash differs.
    // This must be visible before anyone compares their costs or calls one faster.
    expect(comparison.sameQueryHash).toBe(false);
    expect(comparison.left.operators).toBe(34);
    expect(comparison.right.operators).toBe(27);
    expect(comparison.left.rootOperator).toBe("Merge Join");
    expect(comparison.right.rootOperator).toBe("Hash Match");
    expect(comparison.left.rootActualRows).toBe(290);
    expect(comparison.right.rootActualRows).toBe(290);
    expect(comparison.left.cardinalityEstimationModelVersion).toBe(70);
    expect(comparison.right.cardinalityEstimationModelVersion).toBe(120);
    expect(comparison).not.toHaveProperty("speedup");
  });
});
