import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

export const offsetPaginationRule: AnalyzerRule = {
  id: "offset-pagination",
  titleKey: "rule.offset-pagination.title",
  passedKey: "rule.offset-pagination.passed",
  category: "performance",
  analyze: (context) => {
    const fragment = firstMatch(context, /\boffset\s+\d+/i);

    if (!fragment) {
      return null;
    }

    const offsetValue = Number(fragment.match(/\d+/)?.[0] ?? 0);

    return createFinding({
      id: "offset-pagination",
      severity: offsetValue >= 1000 ? "warning" : "info",
      category: "performance",
      detectedFragment: fragment,
      scoreImpact: offsetValue >= 1000 ? 14 : 7,
      relatedTopicIds: ["pagination-offset-vs-keyset", "index-basics"],
      suggestedSqlSnippet:
        "SELECT id, created_at\nFROM table_name\nWHERE created_at < :last_seen_created_at\nORDER BY created_at DESC\nLIMIT 50;",
    });
  },
};
