import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const leadingWildcardLikeRule: AnalyzerRule = {
  id: "leading-wildcard-like",
  titleKey: "rule.leading-wildcard-like.title",
  passedKey: "rule.leading-wildcard-like.passed",
  category: "performance",
  analyze: (context) => {
    const fragment = firstMatch(context, /\blike\s+(['"])%[^'"]*\1/i, "comments");

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "leading-wildcard-like",
      severity: "warning",
      category: "performance",
      detectedFragment: fragment,
      scoreImpact: 12,
      relatedTopicIds: ["functional-indexes", "query-optimization-basics"],
      suggestedSqlSnippet:
        "CREATE INDEX idx_table_column_trgm\nON table_name USING gin (column_name gin_trgm_ops);",
    });
  },
};
