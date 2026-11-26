import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseSqlServerShowplan } from "../core/explain/parseSqlServerShowplan";

const ns = "http://schemas.microsoft.com/sqlserver/2004/07/showplan";
const estimated = `<ShowPlanXML xmlns="${ns}" Version="1.6"><BatchSequence><Batch><Statements><StmtSimple StatementText="SELECT * FROM dbo.Users" StatementType="SELECT" StatementId="1"><QueryPlan><MemoryGrantInfo SerialRequiredMemory="512" SerialDesiredMemory="1024"/><RelOp NodeId="0" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="10" EstimatedTotalSubtreeCost="0.81"><NestedLoops><RelOp NodeId="1" PhysicalOp="Clustered Index Scan" LogicalOp="Clustered Index Scan" EstimateRows="1000" EstimatedTotalSubtreeCost="0.65"><IndexScan><Object Database="[db]" Schema="[dbo]" Table="[Users]" Index="[PK_Users]"/></IndexScan></RelOp><RelOp NodeId="2" PhysicalOp="Key Lookup" LogicalOp="Key Lookup" EstimateRows="1" EstimatedTotalSubtreeCost="0.16"/></NestedLoops></RelOp></QueryPlan></StmtSimple></Statements></Batch></BatchSequence></ShowPlanXML>`;

const actual = `<ShowPlanXML xmlns="${ns}"><BatchSequence><Batch><Statements><StmtSimple StatementText="SELECT id FROM dbo.Users" StatementType="SELECT" StatementId="2"><QueryPlan><RelOp NodeId="0" PhysicalOp="Sort" LogicalOp="Sort" EstimateRows="3" EstimatedTotalSubtreeCost="1.2"><Warnings><SpillToTempDb SpillLevel="2"/><PlanAffectingConvert ConvertIssue="Seek Plan" Expression="CONVERT_IMPLICIT(int,[id],0)"/></Warnings><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="2" ActualExecutions="1" ActualElapsedms="8" ActualCPUms="5" ActualLogicalReads="12"/><RunTimeCountersPerThread Thread="1" ActualRows="3" ActualExecutions="1" ActualElapsedms="7" ActualCPUms="4" ActualLogicalReads="8"/></RunTimeInformation><Sort><RelOp NodeId="1" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="5"/></Sort></RelOp></QueryPlan></StmtSimple></Statements></Batch></BatchSequence></ShowPlanXML>`;

describe("SQL Server Showplan XML", () => {
  it("parses a Microsoft published execution plan and preserves real operator counters", () => {
    const xml = readFileSync(`${process.cwd()}/examples/plans/microsoft-compare1-fast.sqlplan`, "utf8");
    const plan = parseSqlServerShowplan(xml);
    const flatten = (node: typeof plan.statements[number]["root"]): typeof node[] => [node, ...node.children.flatMap(flatten)];
    const nodes = flatten(plan.statements[0]!.root);
    expect(nodes).toHaveLength(27);
    expect(plan.kind).toBe("actual");
    expect(plan.statements[0]?.root.runtime?.[0]?.actualRows).toBe(290);
    expect(plan.statements[0]?.memoryGrant?.serialDesiredMemoryKb).toBe(27376);
    expect(plan.statements[0]?.degreeOfParallelism).toBe(1);
    expect(plan.statements[0]?.memoryGrant?.grantedMemoryKb).toBe(27376);
    expect(plan.statements[0]?.memoryGrant?.maxUsedMemoryKb).toBe(7752);
    expect(nodes[0]?.parallel).toBe(false);
    expect(nodes[0]?.actualRows).toBe(290);
    expect(nodes[0]?.actualExecutions).toBe(1);
    expect(nodes.some((node) => node.object?.index)).toBe(true);
    expect(nodes.some((node) => node.runtime?.some((thread) => thread.actualRowsRead !== undefined))).toBe(true);
  });

  it("reads the paired real Microsoft plan without treating cost as duration", () => {
    const xml = readFileSync(`${process.cwd()}/examples/plans/microsoft-compare1-slow.sqlplan`, "utf8");
    const plan = parseSqlServerShowplan(xml);
    const root = plan.statements[0]!.root;
    expect(root.physicalOp).toBe("Merge Join");
    expect(root.estimateRows).toBe(4.59857e21);
    expect(root.actualRows).toBe(290);
    expect(root.runtime?.[0]?.actualElapsedMs).toBeUndefined();
    expect(plan.statements[0]?.queryHash).toBe("0xF7AF7F558ADB4318");
    expect(plan.statements[0]?.cardinalityEstimationModelVersion).toBe(70);
  });
  it("preserves an estimated operator tree without fabricating runtime metrics", () => {
    const plan = parseSqlServerShowplan(estimated);
    expect(plan.statements).toHaveLength(1);
    expect(plan.statements[0]?.root).toMatchObject({
      physicalOp: "Nested Loops", estimateRows: 10, estimatedSubtreeCost: 0.81,
      children: [
        { physicalOp: "Clustered Index Scan", object: { table: "[Users]", index: "[PK_Users]" } },
        { physicalOp: "Key Lookup" },
      ],
    });
    expect(plan.statements[0]?.root.runtime).toBeUndefined();
    expect(plan.statements[0]?.root.parallel).toBeUndefined();
    expect(plan.statements[0]?.memoryGrant?.serialDesiredMemoryKb).toBe(1024);
    expect(plan.kind).toBe("estimated");
  });

  it("keeps actual counters per thread and warnings with their operator", () => {
    const plan = parseSqlServerShowplan(actual);
    const root = plan.statements[0]!.root;
    expect(plan.kind).toBe("actual");
    expect(root.runtime?.map((thread) => thread.actualRows)).toEqual([2, 3]);
    expect(root.runtime?.map((thread) => thread.actualElapsedMs)).toEqual([8, 7]);
    expect(root.warnings.map((warning) => warning.kind)).toEqual(["spill", "plan-affecting-convert"]);
    expect(root.children[0]?.physicalOp).toBe("Index Seek");
  });

  it("rejects declarations, foreign namespaces, malformed XML and large inputs", () => {
    expect(() => parseSqlServerShowplan(`<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]>${estimated}`)).toThrow();
    expect(() => parseSqlServerShowplan('<ShowPlanXML xmlns="urn:wrong"/>')).toThrow();
    expect(() => parseSqlServerShowplan(estimated.slice(0, -20))).toThrow();
    expect(() => parseSqlServerShowplan("a".repeat(2_000_001))).toThrow();
  });
});
