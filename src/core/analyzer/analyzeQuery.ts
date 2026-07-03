import { format, type SqlLanguage } from "sql-formatter";
import { suggestIndexes } from "../index-advisor/suggestIndexes";
import { createAnalyzerContext, uniqueValues } from "./analyzerUtils";
import { calculateOverallScore, calculateScoreBreakdown } from "./score";
import { analyzerRules } from "./rules";
import type {
  AnalyzerFinding,
  AnalyzerPassedCheck,
  QueryAnalysisResult,
  SqlDialect,
} from "./types";

const formatterLanguageByDialect: Record<SqlDialect, SqlLanguage> = {
  postgresql: "postgresql",
  mysql: "mysql",
  oracle: "plsql",
  sqlite: "sqlite",
  sqlserver: "transactsql",
  generic: "sql",
};

const formatSql = (sql: string, dialect: SqlDialect): string => {
  try {
    return format(sql, {
      language: formatterLanguageByDialect[dialect],
    });
  } catch {
    return sql.trim();
  }
};

const isFinding = (
  finding: AnalyzerFinding | null,
): finding is AnalyzerFinding => finding !== null;

export const analyzeQuery = (
  sql: string,
  dialect: SqlDialect = "postgresql",
): QueryAnalysisResult => {
  const context = createAnalyzerContext(sql, dialect);
  const findings = analyzerRules.map((rule) => rule.analyze(context)).filter(isFinding);
  const findingIds = new Set(findings.map((finding) => finding.id));
  const passedChecks: AnalyzerPassedCheck[] = analyzerRules
    .filter((rule) => !findingIds.has(rule.id))
    .map((rule) => ({
      id: rule.id,
      titleKey: rule.passedKey,
      descriptionKey: rule.passedKey,
      severity: "success",
      category: rule.category,
    }));

  return {
    sql,
    dialect,
    formattedSql: formatSql(sql, dialect),
    score: calculateOverallScore(findings),
    scoreBreakdown: calculateScoreBreakdown(findings),
    findings,
    passedChecks,
    indexSuggestions: suggestIndexes(sql, dialect),
    relatedTopicIds: uniqueValues(
      findings.flatMap((finding) => finding.relatedTopicIds),
    ),
  };
};
