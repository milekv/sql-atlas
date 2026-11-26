import type { AnalyzerRule } from "../types";
import { allMatches, createFinding } from "./ruleUtils";

export const selectStarRule: AnalyzerRule = {
  id: "select-star",
  titleKey: "rule.select-star.title",
  passedKey: "rule.select-star.passed",
  category: "readability",
  analyze: (context) => {
    const matches = allMatches(
      context,
      /\bselect\s+(?:distinct\s+)?(?:[\w"]+\.)?\*/gi,
    );
    return matches.map(({ fragment, offset }) => createFinding({
      id: "select-star",
      severity: "warning",
      category: "readability",
      detectedFragment: fragment,
      statementOffset: offset,
      scoreImpact: 8,
      relatedTopicIds: ["select-basics", "covering-indexes", "unbounded-result-set"],
      suggestedSqlSnippet: "SELECT id, name, created_at\nFROM table_name;",
    }));
  },
};
