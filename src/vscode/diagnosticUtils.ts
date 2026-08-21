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
