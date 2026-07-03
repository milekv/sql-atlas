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
  sharedHitBlocks?: number;
  sharedReadBlocks?: number;
  tempReadBlocks?: number;
  tempWrittenBlocks?: number;
  children: PostgresExplainPlanNode[];
}

export interface ExplainRiskHint {
  id: string;
  nodeType: string;
  description: string;
}
