import { format, type SqlLanguage } from "sql-formatter";
import { suggestIndexes } from "../index-advisor/suggestIndexes";
import { createAnalyzerContext, maskCopyPayload, statementRanges, uniqueValues } from "./analyzerUtils";
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

const locateFinding = (finding: AnalyzerFinding, statement: string, base: number, fullSql: string): AnalyzerFinding => {
  const { statementOffset, ...publicFinding } = finding;
  const fragment = finding.detectedFragment;
  const masked = createAnalyzerContext(statement, "generic").maskedSql;
  let local = statementOffset ?? -1;
  if (local < 0 && fragment) {
    // A whole-statement finding may begin with a comment; point at its SQL keyword.
    if (fragment === statement) local = masked.search(/\S/);
    else {
      const lower = statement.toLowerCase();
      let cursor = 0;
      while ((cursor = lower.indexOf(fragment.toLowerCase(), cursor)) >= 0) {
        if (/\S/.test(masked.slice(cursor, cursor + Math.min(fragment.length, 1)))) {
          local = cursor;
          break;
        }
        cursor += 1;
      }
    }
  }
  if (local < 0) local = masked.search(/\S/);
  if (local < 0) return publicFinding;
  const start = base + local;
  const end = start + (fragment === statement ? (masked.slice(local).match(/^\S+/)?.[0].length ?? 1) : Math.max(1, fragment?.length ?? 1));
  const prefix = fullSql.slice(0, start).split("\n");
  return { ...publicFinding, location: { start, end, line: prefix.length, column: prefix.at(-1)!.length + 1 } };
};

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
  const ranges = statementRanges(maskCopyPayload(sql), context.maskedSql, dialect);
  const statementContexts = ranges.map(({ sql: statement, offset }) => ({
    context: createAnalyzerContext(statement, dialect), offset, statement,
  }));
  const findings = activeRules.flatMap((rule) => statementContexts.flatMap(({ context: statementContext, offset, statement }) => {
    const finding = rule.analyze(statementContext);
    return (finding ? (Array.isArray(finding) ? finding : [finding]) : [])
      .map((item) => locateFinding(item, statement, offset, sql));
  }));
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
