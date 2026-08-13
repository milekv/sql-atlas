import type { AnalyzerContext, SqlDialect } from "./types";

interface MaskOptions {
  strings: boolean;
}

const blank = (character: string): string =>
  character === "\n" || character === "\r" ? character : " ";

const maskSql = (sql: string, { strings }: MaskOptions): string => {
  const output = sql.split("");
  let index = 0;
  let blockDepth = 0;

  const maskRange = (start: number, end: number) => {
    for (let cursor = start; cursor < end; cursor += 1) {
      output[cursor] = blank(sql[cursor]!);
    }
  };

  while (index < sql.length) {
    if (sql.startsWith("--", index)) {
      const end = sql.indexOf("\n", index + 2);
      const boundary = end < 0 ? sql.length : end;
      maskRange(index, boundary);
      index = boundary;
      continue;
    }

    if (sql.startsWith("/*", index)) {
      const start = index;
      blockDepth = 1;
      index += 2;
      while (index < sql.length && blockDepth > 0) {
        if (sql.startsWith("/*", index)) {
          blockDepth += 1;
          index += 2;
        } else if (sql.startsWith("*/", index)) {
          blockDepth -= 1;
          index += 2;
        } else {
          index += 1;
        }
      }
      maskRange(start, index);
      continue;
    }

    const dollar = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)?.[0];
    if (dollar) {
      const end = sql.indexOf(dollar, index + dollar.length);
      const boundary = end < 0 ? sql.length : end + dollar.length;
      maskRange(index, boundary);
      index = boundary;
      continue;
    }

    if (sql[index] === "'") {
      const start = index;
      index += 1;
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") {
          index += 2;
        } else if (sql[index] === "'") {
          index += 1;
          break;
        } else {
          index += 1;
        }
      }
      if (strings) maskRange(start, index);
      continue;
    }

    index += 1;
  }

  return output.join("");
};

export const maskSqlComments = (sql: string): string =>
  maskSql(sql, { strings: false });

export const stripSqlComments = (sql: string): string =>
  maskSqlComments(sql).trim();

export const maskSqlStructure = (sql: string): string =>
  maskSql(sql, { strings: true });

const splitAtStructuralSemicolons = (sql: string, structuralSql: string): string[] => {
  const statements: string[] = [];
  let start = 0;
  for (let index = 0; index < structuralSql.length; index += 1) {
    if (structuralSql[index] !== ";") continue;
    const statement = sql.slice(start, index).trim();
    if (statement) statements.push(statement);
    start = index + 1;
  }
  const finalStatement = sql.slice(start).trim();
  if (finalStatement) statements.push(finalStatement);
  return statements;
};

export const splitSqlStatements = (sql: string): string[] =>
  splitAtStructuralSemicolons(sql, maskSqlStructure(sql));

export const normalizeSql = (sql: string): string =>
  maskSqlStructure(sql).replace(/\s+/g, " ").trim().toLowerCase();

export const createAnalyzerContext = (
  sql: string,
  dialect: SqlDialect,
): AnalyzerContext => {
  const commentMaskedSql = maskSqlComments(sql);
  const maskedSql = maskSqlStructure(sql);
  return {
    sql,
    commentMaskedSql,
    maskedSql,
    normalizedSql: normalizeSql(sql),
    statements: splitAtStructuralSemicolons(sql, maskedSql),
    maskedStatements: splitAtStructuralSemicolons(maskedSql, maskedSql),
    dialect,
  };
};

export const uniqueValues = <T,>(values: T[]): T[] => Array.from(new Set(values));
