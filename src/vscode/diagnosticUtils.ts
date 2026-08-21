import type { AnalyzerSeverity } from "../core/analyzer/types";

const severityRank: Record<Exclude<AnalyzerSeverity, "success">, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export const findFragmentOffset = (sql: string, fragment?: string): number => {
  if (!fragment) return 0;
  const offset = sql.toLowerCase().indexOf(fragment.toLowerCase());
  return offset >= 0 ? offset : 0;
};

export const shouldShowSeverity = (
  severity: Exclude<AnalyzerSeverity, "success">,
  minimum: Exclude<AnalyzerSeverity, "success">,
): boolean => severityRank[severity] >= severityRank[minimum];

export const diagnosticSummary = (errors: number, warnings: number, info: number): string => {
  const total = errors + warnings + info;
  if (total === 0) return "SQL Atlas: no issues";
  const parts = [
    errors > 0 ? `${errors} critical` : "",
    warnings > 0 ? `${warnings} warning${warnings === 1 ? "" : "s"}` : "",
    info > 0 ? `${info} info` : "",
  ].filter(Boolean);
  return `SQL Atlas: ${parts.join(", ")}`;
};
