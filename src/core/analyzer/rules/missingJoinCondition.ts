import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const missingJoinConditionRule: AnalyzerRule = {
  id: "missing-join-condition",
  titleKey: "rule.missing-join-condition.title",
  passedKey: "rule.missing-join-condition.passed",
  category: "safety",
  analyze: (context) => {
    const commaJoin = firstMatch(
      context,
      /\bfrom\s+[\w."]+(?:\s+\w+)?\s*,\s*[\w."]+(?:\s+\w+)?/i,
    );
    const hasJoin = /\bjoin\b/i.test(context.sql) && !/\bcross\s+join\b/i.test(context.sql);
    const lacksJoinPredicate =
      hasJoin && !/\bon\b|\busing\s*\(/i.test(context.sql);

    if (!commaJoin && !lacksJoinPredicate) {
      return null;
    }

    return createFinding({
      id: "missing-join-condition",
      severity: "critical",
      category: "safety",
      detectedFragment: commaJoin ?? firstMatch(context, /\bjoin\s+[\w."]+/i),
      scoreImpact: 25,
      relatedTopicIds: ["join-fundamentals", "inner-join-vs-left-join"],
      suggestedSqlSnippet:
        "SELECT o.id, c.email\nFROM orders o\nJOIN customers c ON c.id = o.customer_id;",
    });
  },
};
