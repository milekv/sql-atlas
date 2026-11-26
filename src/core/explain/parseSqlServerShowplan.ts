import { SaxesParser } from "saxes";

const SHOWPLAN_NAMESPACE = "http://schemas.microsoft.com/sqlserver/2004/07/showplan";
const MAX_INPUT = 2_000_000;
const MAX_ELEMENTS = 100_000;
const MAX_DEPTH = 128;
const MAX_OPERATORS = 10_000;

export interface ShowplanThreadCounters {
  thread?: number;
  actualRows?: number;
  actualExecutions?: number;
  actualElapsedMs?: number;
  actualCpuMs?: number;
  actualLogicalReads?: number;
  actualRowsRead?: number;
  actualPhysicalReads?: number;
  actualRebinds?: number;
  actualRewinds?: number;
}

export interface ShowplanOperator {
  nodeId?: number;
  physicalOp: string;
  logicalOp?: string;
  estimateRows?: number;
  estimatedSubtreeCost?: number;
  estimatedRowsRead?: number;
  parallel?: boolean;
  actualRows?: number;
  actualExecutions?: number;
  object?: { database?: string; schema?: string; table?: string; index?: string };
  runtime?: ShowplanThreadCounters[];
  warnings: Array<{ kind: "spill" | "plan-affecting-convert"; detail?: string }>;
  children: ShowplanOperator[];
}

export interface ShowplanStatement {
  id?: number;
  type?: string;
  text?: string;
  queryHash?: string;
  queryPlanHash?: string;
  cardinalityEstimationModelVersion?: number;
  estimatedSubtreeCost?: number;
  root: ShowplanOperator;
  degreeOfParallelism?: number;
  warnings?: Array<{ kind: "plan-affecting-convert"; detail?: string }>;
  memoryGrant?: { serialRequiredMemoryKb?: number; serialDesiredMemoryKb?: number; grantedMemoryKb?: number; maxUsedMemoryKb?: number };
}

export interface ParsedSqlServerShowplan {
  kind: "estimated" | "actual";
  statements: ShowplanStatement[];
}

type Attributes = Record<string, { value: string } | string>;
const attr = (attributes: Attributes, name: string): string | undefined => {
  const value = attributes[name];
  return typeof value === "string" ? value : value?.value;
};
const numeric = (value?: string): number | undefined => {
  if (value === undefined || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

/** Parse a bounded, untrusted .sqlplan file without resolving external entities. */
export const parseSqlServerShowplan = (xml: string): ParsedSqlServerShowplan => {
  if (!xml.trim() || xml.length > MAX_INPUT) throw new Error("Showplan XML is empty or exceeds the 2 MB limit.");
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw new Error("Showplan XML declarations and entities are not allowed.");

  const statements: ShowplanStatement[] = [];
  const frames: Array<{ local: string; operator?: ShowplanOperator }> = [];
  let statement: Partial<ShowplanStatement> | undefined;
  let elementCount = 0;
  let operatorCount = 0;
  let actual = false;
  const parser = new SaxesParser({ xmlns: true });
  parser.on("doctype", () => { throw new Error("Showplan XML DTD is not allowed."); });
  parser.on("opentag", (tag) => {
    elementCount += 1;
    if (elementCount > MAX_ELEMENTS || frames.length >= MAX_DEPTH) {
      throw new Error("Showplan XML exceeds the element or nesting limit.");
    }
    if (tag.uri !== SHOWPLAN_NAMESPACE) throw new Error("Invalid SQL Server Showplan namespace.");
    if (frames.length === 0 && tag.local !== "ShowPlanXML") throw new Error("Expected a ShowPlanXML root.");
    const attributes = tag.attributes as Attributes;
    const current = [...frames].reverse().find((frame) => frame.operator)?.operator;
    let operator: ShowplanOperator | undefined;

    if (tag.local === "StmtSimple") {
      statement = {
        id: numeric(attr(attributes, "StatementId")), type: attr(attributes, "StatementType"),
        text: attr(attributes, "StatementText"), queryHash: attr(attributes, "QueryHash"),
        queryPlanHash: attr(attributes, "QueryPlanHash"),
        cardinalityEstimationModelVersion: numeric(attr(attributes, "CardinalityEstimationModelVersion")),
        estimatedSubtreeCost: numeric(attr(attributes, "StatementSubTreeCost")), warnings: [],
      };
    } else if (tag.local === "QueryPlan" && statement) {
      statement.degreeOfParallelism = numeric(attr(attributes, "DegreeOfParallelism"));
    } else if (tag.local === "RelOp" && statement) {
      operatorCount += 1;
      if (operatorCount > MAX_OPERATORS) throw new Error("Showplan XML exceeds the operator limit.");
      operator = {
        nodeId: numeric(attr(attributes, "NodeId")),
        physicalOp: attr(attributes, "PhysicalOp") || "Unknown",
        logicalOp: attr(attributes, "LogicalOp"),
        estimateRows: numeric(attr(attributes, "EstimateRows")),
        estimatedSubtreeCost: numeric(attr(attributes, "EstimatedTotalSubtreeCost")),
        estimatedRowsRead: numeric(attr(attributes, "EstimatedRowsRead")),
        parallel: attr(attributes, "Parallel") === undefined ? undefined :
          attr(attributes, "Parallel") === "true" || attr(attributes, "Parallel") === "1",
        warnings: [], children: [],
      };
      if (current) current.children.push(operator);
      else if (!statement.root) statement.root = operator;
    } else if (tag.local === "Object" && current && !current.object) {
      current.object = {
        database: attr(attributes, "Database"), schema: attr(attributes, "Schema"),
        table: attr(attributes, "Table"), index: attr(attributes, "Index"),
      };
    } else if (tag.local === "RunTimeCountersPerThread" && current) {
      actual = true;
      const counters: ShowplanThreadCounters = {
        thread: numeric(attr(attributes, "Thread")),
        actualRows: numeric(attr(attributes, "ActualRows")),
        actualExecutions: numeric(attr(attributes, "ActualExecutions")),
        actualElapsedMs: numeric(attr(attributes, "ActualElapsedms")),
        actualCpuMs: numeric(attr(attributes, "ActualCPUms")),
        actualLogicalReads: numeric(attr(attributes, "ActualLogicalReads")),
        actualRowsRead: numeric(attr(attributes, "ActualRowsRead")),
        actualPhysicalReads: numeric(attr(attributes, "ActualPhysicalReads")),
        actualRebinds: numeric(attr(attributes, "ActualRebinds")),
        actualRewinds: numeric(attr(attributes, "ActualRewinds")),
      };
      (current.runtime ??= []).push(counters);
      if (counters.actualRows !== undefined) current.actualRows = (current.actualRows ?? 0) + counters.actualRows;
      if (counters.actualExecutions !== undefined) current.actualExecutions = (current.actualExecutions ?? 0) + counters.actualExecutions;
    } else if (tag.local === "SpillToTempDb" && current) {
      current.warnings.push({ kind: "spill", detail: attr(attributes, "SpillLevel") });
    } else if (tag.local === "PlanAffectingConvert" && current) {
      current.warnings.push({ kind: "plan-affecting-convert", detail: attr(attributes, "ConvertIssue") });
    } else if (tag.local === "PlanAffectingConvert" && statement) {
      statement.warnings?.push({ kind: "plan-affecting-convert", detail: attr(attributes, "ConvertIssue") });
    } else if (tag.local === "MemoryGrantInfo" && statement) {
      statement.memoryGrant = {
        serialRequiredMemoryKb: numeric(attr(attributes, "SerialRequiredMemory")),
        serialDesiredMemoryKb: numeric(attr(attributes, "SerialDesiredMemory")),
        grantedMemoryKb: numeric(attr(attributes, "GrantedMemory")),
        maxUsedMemoryKb: numeric(attr(attributes, "MaxUsedMemory")),
      };
    }
    frames.push({ local: tag.local, operator });
  });
  parser.on("closetag", (tag) => {
    frames.pop();
    if (tag.local === "StmtSimple" && statement) {
      if (statement.root) statements.push(statement as ShowplanStatement);
      statement = undefined;
    }
  });
  parser.write(xml).close();
  if (statements.length === 0) throw new Error("No supported statement plan found in Showplan XML.");
  return { kind: actual ? "actual" : "estimated", statements };
};
