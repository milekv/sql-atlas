import type { AnalyzerFinding } from "../../core/analyzer/types";
import type { TranslationKey } from "../../i18n/types";

export interface EditorMarker {
  code: string;
  message: string;
  severity: "critical" | "warning" | "info";
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export const offsetPosition = (sql: string, offset: number) => {
  const before = sql.slice(0, Math.min(Math.max(offset, 0), sql.length));
  const lines = before.split("\n");
  return { lineNumber: lines.length, column: lines.at(-1)!.length + 1 };
};

export const toEditorMarkers = (
  sql: string,
  findings: readonly AnalyzerFinding[],
  translate: (key: TranslationKey) => string,
  analyzedSql = sql,
): EditorMarker[] => {
  if (sql !== analyzedSql) return [];
  return findings.flatMap((finding) => {
    const location = finding.location;
    if (!location || location.start < 0 || location.end > sql.length) return [];
    const start = offsetPosition(sql, location.start);
    const end = offsetPosition(sql, Math.max(location.end, location.start + 1));
    return [{
      code: finding.id,
      message: `${translate(finding.titleKey)}. ${translate(finding.suggestionKey)}`,
      severity: finding.severity,
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
    }];
  });
};
