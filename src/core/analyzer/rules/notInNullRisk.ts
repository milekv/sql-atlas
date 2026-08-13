import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const notInNullRiskRule: AnalyzerRule = {
  id: "not-in-null-risk",
  titleKey: "rule.not-in-null-risk.title",
  passedKey: "rule.not-in-null-risk.passed",
  category: "safety",
  analyze: (context) => {
    const fragment = firstMatch(context, /\bnot\s+in\s*\((?!\s*select\b)[^)]*\)/i, "comments");

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "not-in-null-risk",
      severity: "warning",
      category: "safety",
      detectedFragment: fragment,
      scoreImpact: 10,
      relatedTopicIds: ["where-filtering", "subqueries"],
      suggestedSqlSnippet:
        "WHERE NOT EXISTS (\n  SELECT 1\n  FROM blocked_ids b\n  WHERE b.id = users.id\n)",
    });
  },
};
