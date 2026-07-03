import type { AnalyzerRule } from "../types";
import { countMatches, createFinding, getWhereClause } from "./ruleUtils";

export const tooManyOrConditionsRule: AnalyzerRule = {
  id: "too-many-or-conditions",
  titleKey: "rule.too-many-or-conditions.title",
  passedKey: "rule.too-many-or-conditions.passed",
  category: "performance",
  analyze: (context) => {
    const whereClause = getWhereClause(context.sql);

    if (!whereClause || countMatches(whereClause, /\bor\b/gi) < 3) {
      return null;
    }

    return createFinding({
      id: "too-many-or-conditions",
      severity: "warning",
      category: "performance",
      detectedFragment: whereClause,
      scoreImpact: 10,
      relatedTopicIds: ["where-filtering", "query-optimization-basics"],
      suggestedSqlSnippet:
        "SELECT id\nFROM table_name\nWHERE status IN ('open', 'pending', 'queued');",
    });
  },
};
