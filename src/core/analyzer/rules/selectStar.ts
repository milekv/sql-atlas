import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const selectStarRule: AnalyzerRule = {
  id: "select-star",
  titleKey: "rule.select-star.title",
  passedKey: "rule.select-star.passed",
  category: "readability",
  analyze: (context) => {
    const fragment = firstMatch(
      context,
      /\bselect\s+(?:distinct\s+)?(?:[\w"]+\.)?\*/i,
    );

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "select-star",
      severity: "warning",
      category: "readability",
      detectedFragment: fragment,
      scoreImpact: 8,
      relatedTopicIds: ["select-basics", "covering-indexes", "unbounded-result-set"],
      suggestedSqlSnippet: "SELECT id, name, created_at\nFROM table_name;",
    });
  },
};
