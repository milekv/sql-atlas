import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const nullableNotInRule: AnalyzerRule = {
  id: "nullable-not-in",
  titleKey: "rule.nullable-not-in.title",
  passedKey: "rule.nullable-not-in.passed",
  category: "safety",
  analyze: (context) => {
    const fragment = firstMatch(
      context,
      /\bnot\s+in\s*\(\s*select\s+[\s\S]*?\)/i,
    );

    if (!fragment || /\bis\s+not\s+null\b/i.test(fragment)) {
      return null;
    }

    return createFinding({
      id: "nullable-not-in",
      severity: "warning",
      category: "safety",
      detectedFragment: fragment,
      scoreImpact: 8,
      relatedTopicIds: ["subqueries", "where-filtering"],
      suggestedSqlSnippet:
        "WHERE NOT EXISTS (\n  SELECT 1\n  FROM other_table o\n  WHERE o.key = source.key\n)",
    });
  },
};
