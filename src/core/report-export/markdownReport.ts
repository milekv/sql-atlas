import type { Translator } from "../../i18n/types";
import type { Language } from "../../types";
import { getKnowledgeTopicById } from "../../content/contentRegistry";
import type { AnalyzerFinding, QueryAnalysisResult } from "../analyzer/types";

const severityRank: Record<AnalyzerFinding["severity"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const getTopRecommendations = (analysis: QueryAnalysisResult): AnalyzerFinding[] =>
  [...analysis.findings]
    .sort(
      (left, right) =>
        severityRank[right.severity] - severityRank[left.severity] ||
        right.scoreImpact - left.scoreImpact,
    )
    .slice(0, 3);

export const createMarkdownReport = ({
  analysis,
  language,
  t,
}: {
  analysis: QueryAnalysisResult;
  language: Language;
  t: Translator;
}): string => {
  const critical = analysis.findings.filter(
    (finding) => finding.severity === "critical",
  );
  const warnings = analysis.findings.filter(
    (finding) => finding.severity === "warning",
  );
  const info = analysis.findings.filter((finding) => finding.severity === "info");
  const topRecommendations = getTopRecommendations(analysis);

  const formatFindings = (findings: typeof analysis.findings): string =>
    findings.length === 0
      ? "- None"
      : findings
          .map(
            (finding) =>
              `- **${t(finding.titleKey)}** (${t(`category.${finding.category}`)}) - ${t(finding.explanationKey)}`,
          )
          .join("\n");

  const relatedTopics = analysis.relatedTopicIds
    .map((topicId) => getKnowledgeTopicById(topicId))
    .filter((topic) => topic !== undefined)
    .map((topic) => `- ${topic.translations[language].title}`)
    .join("\n");

  return [
    "# SQL Atlas Optimization Report",
    "",
    `**${t("reportMarkdown.generated")}:** ${new Date().toISOString()}`,
    `**${t("reportMarkdown.dialect")}:** ${analysis.dialect}`,
    `**${t("reportMarkdown.score")}:** ${analysis.score}/100`,
    "",
    `## ${t("reportMarkdown.summary")}`,
    "",
    `- Performance: ${analysis.scoreBreakdown.performance}/100`,
    `- Safety: ${analysis.scoreBreakdown.safety}/100`,
    `- Readability: ${analysis.scoreBreakdown.readability}/100`,
    `- Indexing: ${analysis.scoreBreakdown.indexing}/100`,
    "",
    `## ${t("analyzer.topRecommendations")}`,
    "",
    topRecommendations.length === 0
      ? `- ${t("analyzer.noRecommendations")}`
      : topRecommendations
          .map(
            (finding) =>
              `- **${t(finding.titleKey)}** (-${finding.scoreImpact}) - ${t(finding.suggestionKey)}`,
          )
          .join("\n"),
    "",
    `## ${t("reportMarkdown.critical")}`,
    "",
    formatFindings(critical),
    "",
    `## ${t("reportMarkdown.warnings")}`,
    "",
    formatFindings(warnings),
    "",
    `## ${t("reportMarkdown.info")}`,
    "",
    formatFindings(info),
    "",
    `## ${t("analyzer.passedChecks")}`,
    "",
    analysis.passedChecks.length === 0
      ? "- None"
      : analysis.passedChecks
          .slice(0, 12)
          .map((check) => `- ${t(check.titleKey)}`)
          .join("\n"),
    "",
    `## ${t("reportMarkdown.indexes")}`,
    "",
    analysis.indexSuggestions.length === 0
      ? "- None"
      : analysis.indexSuggestions
          .map((suggestion) => `- \`${suggestion.sqlSnippet.replace(/\n/g, " ")}\``)
          .join("\n"),
    "",
    `## ${t("reportMarkdown.formattedSql")}`,
    "",
    "```sql",
    analysis.formattedSql,
    "```",
    "",
    `## ${t("reportMarkdown.related")}`,
    "",
    relatedTopics || "- None",
    "",
    `> ${t("reportMarkdown.disclaimer")}`,
    "",
  ].join("\n");
};
