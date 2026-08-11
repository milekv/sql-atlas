export interface PostgresExplainPlanNode {
  nodeType: string;
  relationName?: string;
  indexName?: string;
  startupCost?: number;
  totalCost?: number;
  planRows?: number;
  actualRows?: number;
  actualStartupTime?: number;
  actualTotalTime?: number;
  actualLoops?: number;
  sharedHitBlocks?: number;
  sharedReadBlocks?: number;
  tempReadBlocks?: number;
  tempWrittenBlocks?: number;
  rowsRemovedByFilter?: number;
  sortMethod?: string;
  children: PostgresExplainPlanNode[];
}

export type ExplainRiskCode =
  | "large-seq-scan"
  | "estimate-mismatch"
  | "temp-io"
  | "external-sort"
  | "filter-waste";

export interface ExplainRiskHint {
  id: string;
  code: ExplainRiskCode;
  nodeType: string;
  relationName?: string;
  value: number;
}

export interface ExplainPlanSummary {
  nodeCount: number;
  executionTime?: number;
  planningTime?: number;
  actualRows: number;
  sharedReadBlocks: number;
  tempWrittenBlocks: number;
}

export interface ParsedExplainPlan {
  root: PostgresExplainPlanNode;
  summary: ExplainPlanSummary;
  risks: ExplainRiskHint[];
}
