import type { AnalyzerRule } from "../types";
import { createFinding, getClause, splitColumns } from "./ruleUtils";

export const groupByManyColumnsRule: AnalyzerRule = {
  id: "group-by-many-columns",
  titleKey: "rule.group-by-many-columns.title",
  passedKey: "rule.group-by-many-columns.passed",
  category: "performance",
  analyze: (context) => {
    const clause = getClause(context.sql, "group by");

    if (!clause || splitColumns(clause).length < 4) {
      return null;
    }

    return createFinding({
      id: "group-by-many-columns",
      severity: "info",
      category: "performance",
      detectedFragment: `GROUP BY ${clause}`,
      scoreImpact: 6,
      relatedTopicIds: ["group-by", "query-optimization-basics"],
      suggestedSqlSnippet:
        "SELECT customer_id, date_trunc('month', created_at) AS month, COUNT(*)\nFROM orders\nGROUP BY customer_id, month;",
    });
  },
};
