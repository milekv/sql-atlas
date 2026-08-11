import type {
  ExplainRiskHint,
  ParsedExplainPlan,
  PostgresExplainPlanNode,
} from "./types";

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const normalizeNode = (value: unknown): PostgresExplainPlanNode => {
  if (!isObject(value) || !asString(value["Node Type"])) {
    throw new Error("The plan contains a node without a Node Type.");
  }

  const plans = value.Plans;
  if (plans !== undefined && !Array.isArray(plans)) {
    throw new Error("The Plans field must be an array.");
  }

  return {
    nodeType: asString(value["Node Type"])!,
    relationName: asString(value["Relation Name"]),
    indexName: asString(value["Index Name"]),
    startupCost: asNumber(value["Startup Cost"]),
    totalCost: asNumber(value["Total Cost"]),
    planRows: asNumber(value["Plan Rows"]),
    actualRows: asNumber(value["Actual Rows"]),
    actualStartupTime: asNumber(value["Actual Startup Time"]),
    actualTotalTime: asNumber(value["Actual Total Time"]),
    actualLoops: asNumber(value["Actual Loops"]),
    sharedHitBlocks: asNumber(value["Shared Hit Blocks"]),
    sharedReadBlocks: asNumber(value["Shared Read Blocks"]),
    tempReadBlocks: asNumber(value["Temp Read Blocks"]),
    tempWrittenBlocks: asNumber(value["Temp Written Blocks"]),
    rowsRemovedByFilter: asNumber(value["Rows Removed by Filter"]),
    sortMethod: asString(value["Sort Method"]),
    children: (plans ?? []).map(normalizeNode),
  };
};

const collectNodes = (root: PostgresExplainPlanNode): PostgresExplainPlanNode[] => [
  root,
  ...root.children.flatMap(collectNodes),
];

const calculateEstimateRatio = (node: PostgresExplainPlanNode): number => {
  const estimated = node.planRows ?? 0;
  const actual = node.actualRows ?? 0;

  if (estimated <= 0 || actual <= 0) {
    return 1;
  }

  return Math.max(actual / estimated, estimated / actual);
};

const findRisks = (nodes: PostgresExplainPlanNode[]): ExplainRiskHint[] =>
  nodes.flatMap((node, index) => {
    const risks: ExplainRiskHint[] = [];
    const rows = node.actualRows ?? node.planRows ?? 0;
    const estimateRatio = calculateEstimateRatio(node);
    const tempBlocks = (node.tempReadBlocks ?? 0) + (node.tempWrittenBlocks ?? 0);
    const filteredRows = node.rowsRemovedByFilter ?? 0;

    if (node.nodeType === "Seq Scan" && rows >= 1_000) {
      risks.push({
        id: `${index}-large-seq-scan`,
        code: "large-seq-scan",
        nodeType: node.nodeType,
        relationName: node.relationName,
        value: rows,
      });
    }

    if (estimateRatio >= 10) {
      risks.push({
        id: `${index}-estimate-mismatch`,
        code: "estimate-mismatch",
        nodeType: node.nodeType,
        relationName: node.relationName,
        value: Math.round(estimateRatio * 10) / 10,
      });
    }

    if (tempBlocks > 0) {
      risks.push({
        id: `${index}-temp-io`,
        code: "temp-io",
        nodeType: node.nodeType,
        relationName: node.relationName,
        value: tempBlocks,
      });
    }

    if (node.sortMethod?.toLowerCase().includes("external")) {
      risks.push({
        id: `${index}-external-sort`,
        code: "external-sort",
        nodeType: node.nodeType,
        relationName: node.relationName,
        value: node.tempWrittenBlocks ?? 0,
      });
    }

    if (filteredRows >= 1_000 && filteredRows > rows) {
      risks.push({
        id: `${index}-filter-waste`,
        code: "filter-waste",
        nodeType: node.nodeType,
        relationName: node.relationName,
        value: filteredRows,
      });
    }

    return risks;
  });

export const parsePostgresExplainJson = (input: string): ParsedExplainPlan => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("Invalid JSON. Paste the result of EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON).");
  }

  const envelope = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!isObject(envelope)) {
    throw new Error("The EXPLAIN JSON result must contain an object.");
  }

  const rawRoot = envelope.Plan ?? envelope;
  const root = normalizeNode(rawRoot);
  const nodes = collectNodes(root);

  return {
    root,
    risks: findRisks(nodes),
    summary: {
      nodeCount: nodes.length,
      executionTime: asNumber(envelope["Execution Time"]),
      planningTime: asNumber(envelope["Planning Time"]),
      actualRows: root.actualRows ?? 0,
      sharedReadBlocks:
        root.sharedReadBlocks ?? nodes.reduce((sum, node) => sum + (node.sharedReadBlocks ?? 0), 0),
      tempWrittenBlocks:
        root.tempWrittenBlocks ?? nodes.reduce((sum, node) => sum + (node.tempWrittenBlocks ?? 0), 0),
    },
  };
};
