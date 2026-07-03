import type { AnalyzerRule } from "../types";
import { createFinding } from "./ruleUtils";

export const possibleNPlusOnePatternRule: AnalyzerRule = {
  id: "possible-n-plus-one-pattern",
  titleKey: "rule.possible-n-plus-one-pattern.title",
  passedKey: "rule.possible-n-plus-one-pattern.passed",
  category: "performance",
  analyze: (context) => {
    const fragment = context.sql.match(
      /\bwhere\s+[\w."]*id\s*=\s*(?::\w+|\$\d+|\?)[\s\S]*\blimit\s+1\b/i,
    )?.[0];

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "possible-n-plus-one-pattern",
      severity: "info",
      category: "performance",
      detectedFragment: fragment,
      scoreImpact: 4,
      relatedTopicIds: ["join-fundamentals", "sql-antipatterns-overview"],
      suggestedSqlSnippet:
        "SELECT child.*\nFROM child\nWHERE child.parent_id = ANY(:parent_ids);",
    });
  },
};
