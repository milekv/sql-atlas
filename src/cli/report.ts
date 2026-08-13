import type { QueryAnalysisResult } from "../core/analyzer/types";
import { createMarkdownReport } from "../core/report-export/markdownReport";
import { createTranslator } from "../i18n/i18n";
import type { CliFormat, SqlInput } from "./types";

export interface CliAnalysis {
  input: SqlInput;
  result: QueryAnalysisResult;
}

const t = createTranslator("en");

const textReport = (analyses: CliAnalysis[]): string => {
  const lines = ["SQL Atlas analysis", ""];
  for (const { input, result } of analyses) {
    lines.push(`${input.source} - score ${result.score}/100`);
    if (result.findings.length === 0) {
      lines.push("  No findings.");
    } else {
      for (const finding of result.findings) {
        lines.push(
          `  [${finding.severity}] ${t(finding.titleKey)} (-${finding.scoreImpact})`,
        );
        lines.push(`    ${t(finding.suggestionKey)}`);
      }
    }
    if (result.indexSuggestions.length > 0) {
      lines.push(`  Index suggestions: ${result.indexSuggestions.length}`);
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
    `${analyses.length} input${analyses.length === 1 ? "" : "s"}, ${findingCount} finding${findingCount === 1 ? "" : "s"}.`,
  );
  return `${lines.join("\n")}\n`;
};

const jsonReport = (analyses: CliAnalysis[]): string =>
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
          title: t(finding.titleKey),
          suggestion: t(finding.suggestionKey),
          scoreImpact: finding.scoreImpact,
          detectedFragment: finding.detectedFragment,
        })),
        indexSuggestions: result.indexSuggestions,
      })),
    },
    null,
    2,
  )}\n`;

const markdownReport = (analyses: CliAnalysis[]): string =>
  analyses
    .map(
      ({ input, result }) =>
        `<!-- source: ${input.source} -->\n\n**Source:** \`${input.source}\`\n\n${createMarkdownReport({
          analysis: result,
          language: "en",
          t,
        })}`,
    )
    .join("\n---\n\n");

export const createCliReport = (
  format: CliFormat,
  analyses: CliAnalysis[],
): string => {
  if (format === "json") return jsonReport(analyses);
  if (format === "markdown") return markdownReport(analyses);
  return textReport(analyses);
};
