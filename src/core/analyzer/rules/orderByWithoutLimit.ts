import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const orderByWithoutLimitRule: AnalyzerRule = {
  id: "order-by-without-limit",
  titleKey: "rule.order-by-without-limit.title",
  passedKey: "rule.order-by-without-limit.passed",
  category: "performance",
  analyze: (context) => {
    if (!/\border\s+by\b/i.test(context.maskedSql)) {
      return null;
    }

    const hasLimit = /\blimit\b|\bfetch\s+first\b|\btop\s+\d+\b/i.test(
      context.maskedSql,
    );

    if (hasLimit) {
      return null;
    }

    return createFinding({
      id: "order-by-without-limit",
      severity: "info",
      category: "performance",
      detectedFragment: firstMatch(context, /\border\s+by\b[\s\S]*$/i),
      scoreImpact: 6,
      relatedTopicIds: ["order-by", "query-optimization-basics"],
      suggestedSqlSnippet:
        "SELECT id, created_at\nFROM table_name\nORDER BY created_at DESC\nLIMIT 100;",
    });
  },
};
