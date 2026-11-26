import type { AnalyzerSeverity } from "../core/analyzer/types";
import type { Language } from "../types";

export const resolveExtensionLanguage = (
  preference: "auto" | Language,
  editorLanguage: string,
): Language => preference === "auto"
  ? (/^pl(?:-|$)/i.test(editorLanguage) ? "pl" : "en")
  : preference;

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

export const diagnosticSummary = (errors: number, warnings: number, info: number, language: Language = "en"): string => {
  const total = errors + warnings + info;
  if (language === "pl") {
    if (total === 0) return "SQL Atlas: brak problemów";
    const plural = (count: number, one: string, few: string, many: string) =>
      count === 1 ? one : count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14) ? few : many;
    return `SQL Atlas: ${[
      errors ? `${errors} ${plural(errors, "krytyczny", "krytyczne", "krytycznych")}` : "",
      warnings ? `${warnings} ${plural(warnings, "ostrzeżenie", "ostrzeżenia", "ostrzeżeń")}` : "",
      info ? `${info} ${plural(info, "informacja", "informacje", "informacji")}` : "",
    ].filter(Boolean).join(", ")}`;
  }
  if (total === 0) return "SQL Atlas: no issues";
  const parts = [
    errors > 0 ? `${errors} critical` : "",
    warnings > 0 ? `${warnings} warning${warnings === 1 ? "" : "s"}` : "",
    info > 0 ? `${info} info` : "",
  ].filter(Boolean);
  return `SQL Atlas: ${parts.join(", ")}`;
};
