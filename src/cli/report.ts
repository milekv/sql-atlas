import type { QueryAnalysisResult } from "../core/analyzer/types";
import { createMarkdownReport } from "../core/report-export/markdownReport";
import { createTranslator } from "../i18n/i18n";
import type { Language } from "../types";
import type { CliFormat, SqlInput } from "./types";

export interface CliAnalysis {
  input: SqlInput;
  result: QueryAnalysisResult;
}

const textReport = (analyses: CliAnalysis[], language: Language): string => {
  const t = createTranslator(language);
  const lines = [language === "pl" ? "Analiza SQL Atlas" : "SQL Atlas analysis", ""];
  for (const { input, result } of analyses) {
    lines.push(`${input.source} - ${language === "pl" ? "punktacja reguł" : "score"} ${result.score}/100`);
    if (result.findings.length === 0) {
      lines.push(language === "pl" ? "  Brak trafień reguł." : "  No findings.");
    } else {
      for (const finding of result.findings) {
        lines.push(
          `  [${language === "pl" ? t(`severity.${finding.severity}`) : finding.severity}] ${t(finding.titleKey)} (-${finding.scoreImpact})`,
        );
        lines.push(`    ${t(finding.suggestionKey)}`);
      }
    }
    if (result.indexSuggestions.length > 0) {
      lines.push(`  ${language === "pl" ? "Sugestie indeksów" : "Index suggestions"}: ${result.indexSuggestions.length}`);
      for (const suggestion of result.indexSuggestions) {
        lines.push(`    ${suggestion.sqlSnippet.replace(/\s+/g, " ").trim()}`);
      }
    }
    lines.push("");
  }

  const findingCount = analyses.reduce(
    (sum, analysis) => sum + analysis.result.findings.length,
    0,
  );
  lines.push(
    language === "pl" ? `${analyses.length} plików lub wejść, ${findingCount} trafień reguł.`
      : `${analyses.length} input${analyses.length === 1 ? "" : "s"}, ${findingCount} finding${findingCount === 1 ? "" : "s"}.`,
  );
  return `${lines.join("\n")}\n`;
};

const jsonReport = (analyses: CliAnalysis[], language: Language): string =>
  `${JSON.stringify(
    {
      version: 1,
      summary: {
        inputs: analyses.length,
        findings: analyses.reduce(
          (sum, analysis) => sum + analysis.result.findings.length,
          0,
        ),
        lowestScore: Math.min(...analyses.map((analysis) => analysis.result.score)),
      },
      results: analyses.map(({ input, result }) => ({
        source: input.source,
        dialect: result.dialect,
        score: result.score,
        scoreBreakdown: result.scoreBreakdown,
        findings: result.findings.map((finding) => ({
          id: finding.id,
          severity: finding.severity,
          category: finding.category,
          title: createTranslator(language)(finding.titleKey),
          suggestion: createTranslator(language)(finding.suggestionKey),
          scoreImpact: finding.scoreImpact,
          detectedFragment: finding.detectedFragment,
          location: finding.location,
        })),
        indexSuggestions: result.indexSuggestions,
      })),
    },
    null,
    2,
  )}\n`;

const markdownReport = (analyses: CliAnalysis[], language: Language): string =>
  analyses
    .map(
      ({ input, result }) =>
        `<!-- source: ${input.source} -->\n\n**${language === "pl" ? "Źródło" : "Source"}:** \`${input.source}\`\n\n${createMarkdownReport({
          analysis: result,
          language,
          t: createTranslator(language),
        })}`,
    )
    .join("\n---\n\n");

const sarifLevel = (severity: "critical" | "warning" | "info") => {
  if (severity === "critical") return "error";
  if (severity === "warning") return "warning";
  return "note";
};

const fragmentRegion = (sql: string, fragment?: string) => {
  if (!fragment) return { startLine: 1, startColumn: 1 };
  const offset = sql.toLowerCase().indexOf(fragment.toLowerCase());
  if (offset < 0) return { startLine: 1, startColumn: 1 };
  const before = sql.slice(0, offset);
  const lines = before.split("\n");
  return { startLine: lines.length, startColumn: lines.at(-1)!.length + 1 };
};

const sarifReport = (analyses: CliAnalysis[], language: Language): string => {
  const t = createTranslator(language);
  const findings = analyses.flatMap(({ input, result }) =>
    result.findings.map((finding) => ({ input, finding })),
  );
  const uniqueRules = [...new Map(findings.map(({ finding }) => [
    finding.id,
    {
      id: finding.id,
      name: finding.id,
      shortDescription: { text: t(finding.titleKey) },
      fullDescription: { text: t(finding.descriptionKey) },
      help: { text: t(finding.suggestionKey) },
      defaultConfiguration: { level: sarifLevel(finding.severity) },
      properties: { category: finding.category },
    },
  ])).values()];

  return `${JSON.stringify({
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{
      tool: { driver: {
        name: "SQL Atlas",
        informationUri: "https://github.com/milekv/sql-atlas",
        rules: uniqueRules,
      } },
      results: findings.map(({ input, finding }) => ({
        ruleId: finding.id,
        level: sarifLevel(finding.severity),
        message: { text: `${t(finding.titleKey)} ${t(finding.suggestionKey)}` },
        locations: [{ physicalLocation: {
          artifactLocation: { uri: input.source.replace(/\\/g, "/") },
          region: finding.location
            ? { startLine: finding.location.line, startColumn: finding.location.column }
            : fragmentRegion(input.sql, finding.detectedFragment),
        } }],
        properties: { category: finding.category, scoreImpact: finding.scoreImpact },
      })),
    }],
  }, null, 2)}\n`;
};

export const createCliReport = (
  format: CliFormat,
  analyses: CliAnalysis[],
  language: Language = "en",
): string => {
  if (format === "json") return jsonReport(analyses, language);
  if (format === "markdown") return markdownReport(analyses, language);
  if (format === "sarif") return sarifReport(analyses, language);
  return textReport(analyses, language);
};
