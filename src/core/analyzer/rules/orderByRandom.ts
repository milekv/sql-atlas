import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const orderByRandomRule: AnalyzerRule = {
  id: "order-by-random",
  titleKey: "rule.order-by-random.title",
  passedKey: "rule.order-by-random.passed",
  category: "performance",
  analyze: (context) => {
    const fragment = firstMatch(
      context,
      /\border\s+by\s+(random\s*\(\)|rand\s*\(\)|newid\s*\(\))/i,
    );

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "order-by-random",
      severity: "warning",
      category: "performance",
      detectedFragment: fragment,
      scoreImpact: 12,
      relatedTopicIds: ["query-optimization-basics", "order-by"],
      suggestedSqlSnippet:
        "SELECT *\nFROM table_name TABLESAMPLE SYSTEM (1)\nLIMIT 1;",
    });
  },
};
