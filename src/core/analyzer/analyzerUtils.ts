import type { AnalyzerContext, SqlDialect } from "./types";

export const stripSqlComments = (sql: string): string =>
  sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

export const splitSqlStatements = (sql: string): string[] =>
  stripSqlComments(sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

export const normalizeSql = (sql: string): string =>
  stripSqlComments(sql).replace(/\s+/g, " ").trim().toLowerCase();

export const createAnalyzerContext = (
  sql: string,
  dialect: SqlDialect,
): AnalyzerContext => ({
  sql,
  normalizedSql: normalizeSql(sql),
  statements: splitSqlStatements(sql),
  dialect,
});

export const uniqueValues = <T,>(values: T[]): T[] => Array.from(new Set(values));
