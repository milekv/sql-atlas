import type { AnalyzerRule } from "../types";
import { actionStart, createFinding, hasTopLevelWhere } from "./ruleUtils";

export const updateWithoutWhereRule: AnalyzerRule = {
  id: "update-without-where",
  titleKey: "rule.update-without-where.title",
  passedKey: "rule.update-without-where.passed",
  category: "safety",
  analyze: (context) => {
    const offset = actionStart(context.maskedSql, "update");
    const statement = offset >= 0 && !hasTopLevelWhere(context.maskedSql.slice(offset)) ? context.sql : undefined;

    if (!statement) {
      return null;
    }

    return createFinding({
      id: "update-without-where",
      severity: "critical",
      category: "safety",
      detectedFragment: statement.slice(offset).trimStart(),
      statementOffset: offset,
      scoreImpact: 30,
      relatedTopicIds: ["transactions", "sql-antipatterns-overview"],
      suggestedSqlSnippet:
        "BEGIN;\nUPDATE table_name\nSET column_name = value\nWHERE id = :id;\nCOMMIT;",
    });
  },
};
