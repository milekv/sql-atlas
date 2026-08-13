import type { AnalyzerRule } from "../types";
import { createFinding, getWhereClause } from "./ruleUtils";

const functionOnColumnPattern =
  /\b(lower|upper|trim|date|coalesce|substring|substr|cast)\s*\(\s*([\w."]+)/i;

export const functionInWhereRule: AnalyzerRule = {
  id: "function-in-where",
  titleKey: "rule.function-in-where.title",
  passedKey: "rule.function-in-where.passed",
  category: "indexing",
  analyze: (context) => {
    const whereClause = getWhereClause(context);
    const fragment = whereClause?.match(functionOnColumnPattern)?.[0];

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "function-in-where",
      severity: "warning",
      category: "indexing",
      detectedFragment: fragment,
      scoreImpact: 12,
      relatedTopicIds: ["functional-indexes", "index-basics"],
      suggestedSqlSnippet:
        "CREATE INDEX idx_table_lower_column\nON table_name (LOWER(column_name));",
    });
  },
};
