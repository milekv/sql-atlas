import type { AnalyzerRule } from "../types";
import { createFinding } from "./ruleUtils";

export const updateWithoutWhereRule: AnalyzerRule = {
  id: "update-without-where",
  titleKey: "rule.update-without-where.title",
  passedKey: "rule.update-without-where.passed",
  category: "safety",
  analyze: (context) => {
    const statementIndex = context.maskedStatements.findIndex(
      (candidate) =>
        /^\s*update\b/i.test(candidate) && !/\bwhere\b/i.test(candidate),
    );
    const statement = statementIndex < 0 ? undefined : context.statements[statementIndex];

    if (!statement) {
      return null;
    }

    return createFinding({
      id: "update-without-where",
      severity: "critical",
      category: "safety",
      detectedFragment: statement,
      scoreImpact: 30,
      relatedTopicIds: ["transactions", "sql-antipatterns-overview"],
      suggestedSqlSnippet:
        "BEGIN;\nUPDATE table_name\nSET column_name = value\nWHERE id = :id;\nCOMMIT;",
    });
  },
};
