import type { ParsedSqlServerShowplan, ShowplanOperator } from "./parseSqlServerShowplan";

export interface PlanSummary {
  operators: number;
  rootOperator: string;
  rootEstimatedRows?: number;
  rootActualRows?: number;
  estimatedSubtreeCost?: number;
  cardinalityEstimationModelVersion?: number;
  operatorCounts: Array<{ operator: string; count: number }>;
}

const summarize = (plan: ParsedSqlServerShowplan): PlanSummary => {
  const counts = new Map<string, number>();
  let operators = 0;
  const visit = (node: ShowplanOperator): void => {
    operators += 1;
    counts.set(node.physicalOp, (counts.get(node.physicalOp) ?? 0) + 1);
    node.children.forEach(visit);
  };
  plan.statements.forEach((statement) => visit(statement.root));
  const statement = plan.statements[0]!;
  return {
    operators, rootOperator: statement.root.physicalOp,
    rootEstimatedRows: statement.root.estimateRows,
    rootActualRows: statement.root.actualRows,
    estimatedSubtreeCost: statement.estimatedSubtreeCost,
    cardinalityEstimationModelVersion: statement.cardinalityEstimationModelVersion,
    operatorCounts: [...counts].map(([operator, count]) => ({ operator, count })).sort((a, b) => a.operator.localeCompare(b.operator)),
  };
};

export const compareSqlServerPlans = (left: ParsedSqlServerShowplan, right: ParsedSqlServerShowplan) => {
  const leftHash = left.statements[0]?.queryHash;
  const rightHash = right.statements[0]?.queryHash;
  return {
    sameQueryHash: leftHash && rightHash ? leftHash.toLowerCase() === rightHash.toLowerCase() : undefined,
    left: summarize(left), right: summarize(right),
  };
};
