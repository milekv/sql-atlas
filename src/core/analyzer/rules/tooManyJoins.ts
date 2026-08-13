import type { AnalyzerRule } from "../types";
import { countMatches, createFinding } from "./ruleUtils";

export const tooManyJoinsRule: AnalyzerRule = {
  id: "too-many-joins",
  titleKey: "rule.too-many-joins.title",
  passedKey: "rule.too-many-joins.passed",
  category: "performance",
  analyze: (context) => {
    const joinCount = countMatches(context.maskedSql, /\bjoin\b/gi);

    if (joinCount < 5) {
      return null;
    }

    return createFinding({
      id: "too-many-joins",
      severity: "info",
      category: "performance",
      detectedFragment: `${joinCount} JOIN clauses`,
      scoreImpact: 7,
      relatedTopicIds: ["join-fundamentals", "query-optimization-basics"],
      suggestedSqlSnippet:
        "Review join order with EXPLAIN ANALYZE and verify indexes on join keys.",
    });
  },
};
