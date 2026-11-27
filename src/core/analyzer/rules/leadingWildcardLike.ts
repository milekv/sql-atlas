import type { AnalyzerRule } from "../types";
import { allMatches, createFinding } from "./ruleUtils";

export const leadingWildcardLikeRule: AnalyzerRule = {
  id: "leading-wildcard-like",
  titleKey: "rule.leading-wildcard-like.title",
  passedKey: "rule.leading-wildcard-like.passed",
  category: "performance",
  analyze: (context) => {
    return allMatches(context, /\blike\s+(['"])%[^'"]*\1/gi, "comments").map(({ fragment, offset }) => createFinding({
      id: "leading-wildcard-like",
      severity: "warning",
      category: "performance",
      detectedFragment: fragment,
      statementOffset: offset,
      scoreImpact: 12,
      relatedTopicIds: ["functional-indexes", "query-optimization-basics"],
      suggestedSqlSnippet: context.dialect === "postgresql"
        ? "-- Requires the pg_trgm extension; verify the operator class and data first.\nCREATE INDEX idx_table_column_trgm\nON table_name USING gin (column_name gin_trgm_ops);"
        : undefined,
    }));
  },
};
