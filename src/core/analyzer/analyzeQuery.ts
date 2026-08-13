import { format, type SqlLanguage } from "sql-formatter";
import { suggestIndexes } from "../index-advisor/suggestIndexes";
import { createAnalyzerContext, uniqueValues } from "./analyzerUtils";
import { calculateOverallScore, calculateScoreBreakdown } from "./score";
import { analyzerRules } from "./rules";
import {
  createBeforeAfterRewrite,
  createOptimizationStory,
  extractQueryMap,
} from "./experience";
import type {
  AnalyzerFinding,
  AnalyzerOptions,
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

const inlineIgnoredRules = (sql: string): Set<string> => {
  const ignored = new Set<string>();
  for (const match of sql.matchAll(/(?:--|\/\*)\s*sql-atlas-ignore\s+([^\n*]+)/gi)) {
    for (const id of match[1]!.split(/[\s,]+/).filter(Boolean)) ignored.add(id);
  }
  return ignored;
};

export const analyzeQuery = (
  sql: string,
  dialect: SqlDialect = "postgresql",
  options: AnalyzerOptions = {},
): QueryAnalysisResult => {
  const context = createAnalyzerContext(sql, dialect);
  const ignored = inlineIgnoredRules(sql);
  for (const rule of options.ignoreRules ?? []) ignored.add(rule);
  const activeRules = analyzerRules.filter((rule) => !ignored.has(rule.id));
  const findings = activeRules.map((rule) => rule.analyze(context)).filter(isFinding);
  const findingIds = new Set(findings.map((finding) => finding.id));
  const passedChecks: AnalyzerPassedCheck[] = activeRules
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
    optimizationStory: createOptimizationStory(findings),
    beforeAfter: createBeforeAfterRewrite(sql, findings),
    queryMap: extractQueryMap(sql, findings),
    passedChecks,
    indexSuggestions: suggestIndexes(sql, dialect),
    relatedTopicIds: uniqueValues(
      findings.flatMap((finding) => finding.relatedTopicIds),
    ),
  };
};
