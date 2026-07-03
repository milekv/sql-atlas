import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const unsafeDropTableRule: AnalyzerRule = {
  id: "unsafe-drop-table",
  titleKey: "rule.unsafe-drop-table.title",
  passedKey: "rule.unsafe-drop-table.passed",
  category: "safety",
  analyze: (context) => {
    const fragment = firstMatch(context, /\bdrop\s+table\b[\s\S]*?(;|$)/i);

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "unsafe-drop-table",
      severity: "critical",
      category: "safety",
      detectedFragment: fragment,
      scoreImpact: 35,
      relatedTopicIds: ["transactions", "sql-antipatterns-overview"],
      suggestedSqlSnippet:
        "-- Use a reviewed migration and verified backup before destructive DDL.",
    });
  },
};
