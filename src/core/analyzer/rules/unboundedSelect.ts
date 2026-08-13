import type { AnalyzerRule } from "../types";
import { createFinding } from "./ruleUtils";

export const unboundedSelectRule: AnalyzerRule = {
  id: "unbounded-select",
  titleKey: "rule.unbounded-select.title",
  passedKey: "rule.unbounded-select.passed",
  category: "performance",
  analyze: (context) => {
    const statementIndex = context.maskedStatements.findIndex((candidate) => {
      if (!/^\s*select\b/i.test(candidate) || !/\bfrom\b/i.test(candidate)) {
        return false;
      }

      return !/\bwhere\b|\blimit\b|\bfetch\b|\btop\s+\d+\b|\bgroup\s+by\b|\bcount\s*\(|\bsum\s*\(|\bavg\s*\(|\bmin\s*\(|\bmax\s*\(/i.test(
        candidate,
      );
    });
    const statement = statementIndex < 0 ? undefined : context.statements[statementIndex];

    if (!statement) {
      return null;
    }

    return createFinding({
      id: "unbounded-select",
      severity: "info",
      category: "performance",
      detectedFragment: statement,
      scoreImpact: 6,
      relatedTopicIds: ["where-filtering", "pagination-offset-vs-keyset"],
      suggestedSqlSnippet:
        "SELECT id, name\nFROM table_name\nWHERE created_at >= CURRENT_DATE - INTERVAL '30 days'\nLIMIT 100;",
    });
  },
};
