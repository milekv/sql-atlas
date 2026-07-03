import type { AnalyzerRule } from "../types";
import { createFinding } from "./ruleUtils";

export const deleteWithoutWhereRule: AnalyzerRule = {
  id: "delete-without-where",
  titleKey: "rule.delete-without-where.title",
  passedKey: "rule.delete-without-where.passed",
  category: "safety",
  analyze: (context) => {
    const statement = context.statements.find(
      (candidate) =>
        /^\s*delete\s+from\b/i.test(candidate) && !/\bwhere\b/i.test(candidate),
    );

    if (!statement) {
      return null;
    }

    return createFinding({
      id: "delete-without-where",
      severity: "critical",
      category: "safety",
      detectedFragment: statement,
      scoreImpact: 32,
      relatedTopicIds: ["transactions", "sql-antipatterns-overview"],
      suggestedSqlSnippet:
        "BEGIN;\nDELETE FROM table_name\nWHERE id = :id;\nCOMMIT;",
    });
  },
};
