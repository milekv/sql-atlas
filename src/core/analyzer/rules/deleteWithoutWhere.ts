import type { AnalyzerRule } from "../types";
import { actionStart, createFinding, hasTopLevelWhere } from "./ruleUtils";

export const deleteWithoutWhereRule: AnalyzerRule = {
  id: "delete-without-where",
  titleKey: "rule.delete-without-where.title",
  passedKey: "rule.delete-without-where.passed",
  category: "safety",
  analyze: (context) => {
    const offset = actionStart(context.maskedSql, "delete");
    const statement = offset >= 0 && /^delete\s+from\b/i.test(context.maskedSql.slice(offset)) &&
      !hasTopLevelWhere(context.maskedSql.slice(offset)) ? context.sql : undefined;

    if (!statement) {
      return null;
    }

    return createFinding({
      id: "delete-without-where",
      severity: "critical",
      category: "safety",
      detectedFragment: statement.slice(offset).trimStart(),
      statementOffset: offset,
      scoreImpact: 32,
      relatedTopicIds: ["transactions", "sql-antipatterns-overview"],
      suggestedSqlSnippet:
        "BEGIN;\nDELETE FROM table_name\nWHERE id = :id;\nCOMMIT;",
    });
  },
};
