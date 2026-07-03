import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const crossJoinRule: AnalyzerRule = {
  id: "cross-join",
  titleKey: "rule.cross-join.title",
  passedKey: "rule.cross-join.passed",
  category: "performance",
  analyze: (context) => {
    const fragment = firstMatch(context, /\bcross\s+join\s+[\w."]+/i);

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "cross-join",
      severity: "warning",
      category: "performance",
      detectedFragment: fragment,
      scoreImpact: 12,
      relatedTopicIds: ["join-fundamentals", "sql-antipatterns-overview"],
      suggestedSqlSnippet:
        "SELECT *\nFROM orders o\nJOIN customers c ON c.id = o.customer_id;",
    });
  },
};
