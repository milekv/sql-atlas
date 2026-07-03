import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const distinctOveruseRule: AnalyzerRule = {
  id: "distinct-overuse",
  titleKey: "rule.distinct-overuse.title",
  passedKey: "rule.distinct-overuse.passed",
  category: "readability",
  analyze: (context) => {
    const fragment = firstMatch(context, /\bselect\s+distinct\b/i);

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "distinct-overuse",
      severity: "info",
      category: "readability",
      detectedFragment: fragment,
      scoreImpact: 5,
      relatedTopicIds: ["join-fundamentals", "group-by"],
      suggestedSqlSnippet:
        "SELECT customer_id, COUNT(*) AS order_count\nFROM orders\nGROUP BY customer_id;",
    });
  },
};
