import type { AnalyzerRule } from "../types";
import { createFinding, getWhereClause } from "./ruleUtils";

const functionOnColumnPattern =
  /\b(?:extract\s*\(\s*\w+\s+from\s+[\w."]+|datepart\s*\(\s*\w+\s*,\s*[\w."]+|convert\s*\(\s*[\w.]+\s*,\s*[\w."]+|(?:lower|upper|trim|date|coalesce|substring|substr|cast|year|month|trunc)\s*\(\s*[\w."]+)/gi;

export const functionInWhereRule: AnalyzerRule = {
  id: "function-in-where",
  titleKey: "rule.function-in-where.title",
  passedKey: "rule.function-in-where.passed",
  category: "indexing",
  analyze: (context) => {
    const whereClause = getWhereClause(context);
    if (!whereClause) return null;
    const whereStart = context.maskedSql.indexOf(whereClause);
    return [...whereClause.matchAll(functionOnColumnPattern)].map((match) => {
      const fragment = context.sql.slice(whereStart + match.index, whereStart + match.index + match[0].length);
      return createFinding({
      id: "function-in-where",
      severity: "warning",
      category: "indexing",
      detectedFragment: fragment,
      statementOffset: whereStart + match.index,
      scoreImpact: 12,
      relatedTopicIds: ["functional-indexes", "index-basics"],
      suggestedSqlSnippet: context.dialect === "postgresql" && /^lower\s*\(/i.test(fragment)
        ? "CREATE INDEX idx_table_lower_column\nON table_name (LOWER(column_name));"
        : undefined,
      });
    });
  },
};
