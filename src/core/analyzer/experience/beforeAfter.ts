import type { AnalyzerFinding } from "../types";
import type { BeforeAfterDiffLine, BeforeAfterRewrite } from "./types";

const trimTrailingSemicolons = (sql: string): string =>
  sql.trim().replace(/;+\s*$/, "");

const createDiffLines = (
  before: string,
  after?: string,
): Pick<BeforeAfterRewrite, "originalLines" | "suggestedLines"> => {
  const beforeLines = before.trim().split(/\r?\n/);
  const afterLines = after?.trim().split(/\r?\n/) ?? [];
  const maxLines = Math.max(beforeLines.length, afterLines.length);

  const toDiffLine = (
    value: string | undefined,
    otherValue: string | undefined,
    index: number,
  ): BeforeAfterDiffLine => ({
    lineNumber: index + 1,
    value: value ?? "",
    changed: (value ?? "") !== (otherValue ?? ""),
  });

  return {
    originalLines: Array.from({ length: beforeLines.length }, (_, index) =>
      toDiffLine(beforeLines[index], index < maxLines ? afterLines[index] : "", index),
    ),
    suggestedLines: Array.from({ length: afterLines.length }, (_, index) =>
      toDiffLine(afterLines[index], beforeLines[index], index),
    ),
  };
};

const replaceSelectStar = (sql: string): string =>
  sql.replace(
    /\bselect\s+(distinct\s+)?(?:[\w"]+\.)?\*/i,
    (_match, distinct: string | undefined) =>
      `SELECT ${distinct ?? ""}id, column_name`,
  );

const addExampleLimit = (sql: string): string => `${trimTrailingSemicolons(sql)}
LIMIT 100;`;

const findingById = (findings: AnalyzerFinding[], id: AnalyzerFinding["id"]) =>
  findings.find((finding) => finding.id === id);

export const createBeforeAfterRewrite = (
  sql: string,
  findings: AnalyzerFinding[],
): BeforeAfterRewrite => {
  const originalSql = sql.trim();
  const deleteWithoutWhere = findingById(findings, "delete-without-where");
  const updateWithoutWhere = findingById(findings, "update-without-where");

  if (deleteWithoutWhere || updateWithoutWhere) {
    const { originalLines, suggestedLines } = createDiffLines(originalSql);

    return {
      status: "unsafe-blocked",
      originalSql,
      originalLines,
      suggestedLines,
      notes: [],
      warningKey: deleteWithoutWhere
        ? "analyzer.beforeAfter.warning.delete"
        : "analyzer.beforeAfter.warning.update",
    };
  }

  let suggestedSql = originalSql;
  const notes: BeforeAfterRewrite["notes"] = [];

  if (findingById(findings, "select-star")) {
    suggestedSql = replaceSelectStar(suggestedSql);
    notes.push("analyzer.beforeAfter.note.selectStarPlaceholder");
  }

  if (findingById(findings, "order-by-without-limit")) {
    suggestedSql = addExampleLimit(suggestedSql);
    notes.push("analyzer.beforeAfter.note.limitExample");
  }

  const functionFinding = findingById(findings, "function-in-where");
  if (functionFinding) {
    notes.push("analyzer.beforeAfter.note.functionalIndex");
  }

  if (suggestedSql !== originalSql) {
    const { originalLines, suggestedLines } = createDiffLines(
      originalSql,
      suggestedSql,
    );

    return {
      status: "available",
      originalSql,
      suggestedSql,
      originalLines,
      suggestedLines,
      notes,
      extraSqlSnippet: functionFinding?.suggestedSqlSnippet,
    };
  }

  if (functionFinding?.suggestedSqlSnippet) {
    const { originalLines, suggestedLines } = createDiffLines(originalSql);

    return {
      status: "advice-only",
      originalSql,
      originalLines,
      suggestedLines,
      notes,
      extraSqlSnippet: functionFinding.suggestedSqlSnippet,
    };
  }

  const { originalLines, suggestedLines } = createDiffLines(originalSql);

  return {
    status: "none",
    originalSql,
    originalLines,
    suggestedLines,
    notes: ["analyzer.beforeAfter.note.noDeterministicRewrite"],
  };
};
