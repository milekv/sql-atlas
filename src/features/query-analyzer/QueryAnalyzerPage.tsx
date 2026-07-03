import { Info, Play, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { SqlEditor } from "../../components/editor/SqlEditor";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { CopyButton } from "../../components/ui/CopyButton";
import { SelectInput } from "../../components/ui/Field";
import { analyzeQuery } from "../../core/analyzer/analyzeQuery";
import { createMarkdownReport } from "../../core/report-export/markdownReport";
import type {
  AnalyzerFinding,
  AnalyzerSeverity,
  QueryAnalysisResult,
  SqlDialect,
} from "../../core/analyzer/types";
import { getKnowledgeTopicById } from "../../content/contentRegistry";
import type { TranslationKey } from "../../i18n/types";
import { sqlSamples } from "../../samples/sqlSamples";

const severityOrder: Exclude<AnalyzerSeverity, "success">[] = [
  "critical",
  "warning",
  "info",
];

const dialects: SqlDialect[] = [
  "postgresql",
  "mysql",
  "oracle",
  "sqlite",
  "sqlserver",
  "generic",
];

const groupFindings = (analysis: QueryAnalysisResult | null) =>
  severityOrder.map((severity) => ({
    severity,
    findings:
      analysis?.findings.filter((finding) => finding.severity === severity) ?? [],
  }));

const severityRank: Record<AnalyzerFinding["severity"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const getTopRecommendations = (
  analysis: QueryAnalysisResult | null,
): AnalyzerFinding[] =>
  [...(analysis?.findings ?? [])]
    .sort(
      (left, right) =>
        severityRank[right.severity] - severityRank[left.severity] ||
        right.scoreImpact - left.scoreImpact,
    )
    .slice(0, 3);

export const QueryAnalyzerPage = () => {
  const { language, latestAnalysis, setLatestAnalysis, setPage, t } = useApp();
  const [sql, setSql] = useState("");
  const [dialect, setDialect] = useState<SqlDialect>("postgresql");
  const groupedFindings = useMemo(
    () => groupFindings(latestAnalysis),
    [latestAnalysis],
  );
  const topRecommendations = useMemo(
    () => getTopRecommendations(latestAnalysis),
    [latestAnalysis],
  );

  const runAnalysis = (query = sql) => {
    if (!query.trim()) {
      setLatestAnalysis(null);
      return;
    }
    setLatestAnalysis(analyzeQuery(query, dialect));
  };

  const loadSample = (query: string) => {
    setSql(query);
    setLatestAnalysis(analyzeQuery(query, dialect));
  };

  const breakdownData = latestAnalysis
    ? Object.entries(latestAnalysis.scoreBreakdown).map(([category, value]) => ({
        category: t(`category.${category}` as TranslationKey),
        value,
      }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("analyzer.title")} subtitle={t("analyzer.subtitle")} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">{t("analyzer.inputLabel")}</h2>
            <div className="flex flex-wrap gap-2">
              <SelectInput
                value={dialect}
                onChange={(event) => setDialect(event.target.value as SqlDialect)}
                className="w-40"
              >
                {dialects.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectInput>
              <Button
                type="button"
                onClick={() => runAnalysis()}
                variant="primary"
                icon={<Play size={16} />}
              >
                {t("actions.analyze")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSql("");
                  setLatestAnalysis(null);
                }}
                icon={<Trash2 size={16} />}
              >
                {t("actions.clear")}
              </Button>
            </div>
          </div>
          <SqlEditor value={sql} onChange={setSql} />
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">{t("analyzer.samples")}</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {sqlSamples.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => loadSample(sample.sql)}
                  className="rounded-md border border-atlas-border bg-atlas-panelStrong p-3 text-left transition hover:border-atlas-cyan/60"
                >
                  <span className="block text-sm font-semibold text-atlas-text">
                    {t(sample.titleKey)}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-atlas-muted">
                    {t(sample.descriptionKey)}
                  </span>
                  <span className="mt-2 block text-xs text-atlas-cyan">
                    {t("analyzer.sampleNotice")}: {t(sample.noticeKey)}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("analyzer.results")}</h2>
          {!latestAnalysis ? (
            <Card>
              <h3 className="text-xl font-semibold">{t("analyzer.emptyTitle")}</h3>
              <p className="mt-2 text-sm text-atlas-muted">
                {t("analyzer.emptyBody")}
              </p>
            </Card>
          ) : (
            <>
              <Card className="grid gap-4 md:grid-cols-[140px_1fr]">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-atlas-cyan/50 bg-atlas-cyan/10">
                  <div className="text-center">
                    <p className="text-4xl font-semibold">{latestAnalysis.score}</p>
                    <p className="text-xs text-atlas-muted">{t("analyzer.score")}</p>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">
                    {t("analyzer.scoreBreakdown")}
                  </h3>
                  <div className="space-y-3">
                    {breakdownData.map((item) => (
                      <div key={item.category}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                          <span className="text-atlas-muted">{item.category}</span>
                          <span className="font-medium text-atlas-text">
                            {item.value}/100
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-atlas-border">
                          <div
                            className="h-full rounded-full bg-atlas-cyan"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {t("analyzer.topRecommendations")}
                  </h3>
                  <Badge tone="cyan">{topRecommendations.length}</Badge>
                </div>
                {topRecommendations.length === 0 ? (
                  <p className="text-sm text-atlas-muted">
                    {t("analyzer.noRecommendations")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topRecommendations.map((finding) => (
                      <div
                        key={finding.id}
                        className="rounded-md border border-atlas-border bg-atlas-panelStrong p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={finding.severity}>
                            {t(`severity.${finding.severity}` as TranslationKey)}
                          </Badge>
                          <Badge tone="neutral">
                            {t(`category.${finding.category}` as TranslationKey)}
                          </Badge>
                          <span className="text-xs text-atlas-muted">
                            -{finding.scoreImpact}
                          </span>
                        </div>
                        <p className="mt-2 font-medium">{t(finding.titleKey)}</p>
                        <p className="mt-1 text-sm leading-6 text-atlas-muted">
                          {t(finding.suggestionKey)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex items-start gap-3">
                  <Info size={18} className="mt-1 text-atlas-cyan" />
                  <div>
                    <h3 className="text-sm font-semibold">
                      {t("analyzer.trustNoteTitle")}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-atlas-muted">
                      {t("analyzer.trustNoteBody")}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {t("analyzer.markdownReport")}
                  </h3>
                  <CopyButton
                    value={createMarkdownReport({
                      analysis: latestAnalysis,
                      language,
                      t,
                    })}
                    compact
                  />
                </div>
                <p className="text-sm leading-6 text-atlas-muted">
                  {t("report.subtitle")}
                </p>
              </Card>

              {groupedFindings.map((group) => (
                <IssueGroup
                  key={group.severity}
                  title={t(`severity.${group.severity}` as TranslationKey)}
                  severity={group.severity}
                  findings={group.findings}
                  language={language}
                  onOpenKnowledge={() => setPage("knowledge-base")}
                />
              ))}

              <Card>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {t("analyzer.suggestedIndexes")}
                  </h3>
                  <Badge tone="cyan">{latestAnalysis.indexSuggestions.length}</Badge>
                </div>
                {latestAnalysis.indexSuggestions.length === 0 ? (
                  <p className="text-sm text-atlas-muted">
                    {t("analyzer.noIndexSuggestions")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {latestAnalysis.indexSuggestions.slice(0, 4).map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="rounded-md border border-atlas-border bg-atlas-panelStrong p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone="cyan">{suggestion.source}</Badge>
                            <Badge tone="neutral">
                              {t(`confidence.${suggestion.confidence}` as TranslationKey)}
                            </Badge>
                          </div>
                          <CopyButton value={suggestion.sqlSnippet} compact />
                        </div>
                        <CodeBlock code={suggestion.sqlSnippet} className="max-h-36" />
                        <p className="mt-2 text-xs leading-5 text-atlas-muted">
                          {suggestion.reason[language]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {t("analyzer.passedChecks")}
                  </h3>
                  <Badge tone="success">{latestAnalysis.passedChecks.length}</Badge>
                </div>
                <div className="flex max-h-36 flex-wrap gap-2 overflow-auto">
                  {latestAnalysis.passedChecks.map((check) => (
                    <Badge key={check.id} tone="success">
                      {t(check.titleKey)}
                    </Badge>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {t("analyzer.formattedPreview")}
                  </h3>
                  <CopyButton value={latestAnalysis.formattedSql} compact />
                </div>
                <CodeBlock code={latestAnalysis.formattedSql} />
              </Card>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section>
    <h1 className="text-3xl font-semibold">{title}</h1>
    <p className="mt-2 text-atlas-muted">{subtitle}</p>
  </section>
);

const IssueGroup = ({
  title,
  severity,
  findings,
  language,
  onOpenKnowledge,
}: {
  title: string;
  severity: Exclude<AnalyzerSeverity, "success">;
  findings: AnalyzerFinding[];
  language: "en" | "pl";
  onOpenKnowledge: () => void;
}) => {
  const { t } = useApp();

  if (findings.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge tone={severity}>{title}</Badge>
        <span className="text-sm text-atlas-muted">{findings.length}</span>
      </div>
      {findings.map((finding) => (
        <article
          key={finding.id}
          className="rounded-md border border-atlas-border bg-atlas-panelStrong p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h4 className="font-semibold">{t(finding.titleKey)}</h4>
              <p className="mt-1 text-sm leading-6 text-atlas-muted">
                {t(finding.explanationKey)}
              </p>
            </div>
            <Badge tone="neutral">
              {t(`category.${finding.category}` as TranslationKey)}
            </Badge>
            <Badge tone="neutral">
              {t("analyzer.scoreImpact")}: -{finding.scoreImpact}
            </Badge>
          </div>
          {finding.detectedFragment ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-atlas-muted">
                {t("analyzer.detectedFragment")}
              </p>
              <CodeBlock code={finding.detectedFragment} className="max-h-36" />
            </div>
          ) : null}
          <p className="mt-3 text-sm text-atlas-muted">{t(finding.suggestionKey)}</p>
          {finding.suggestedSqlSnippet ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-atlas-muted">
                  {t("analyzer.suggestedSql")}
                </p>
                <CopyButton value={finding.suggestedSqlSnippet} compact />
              </div>
              <CodeBlock code={finding.suggestedSqlSnippet} className="max-h-44" />
            </div>
          ) : null}
          {finding.relatedTopicIds.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {finding.relatedTopicIds.map((topicId) => {
                const topic = getKnowledgeTopicById(topicId);
                return topic ? (
                  <button key={topicId} type="button" onClick={onOpenKnowledge}>
                    <Badge tone="violet">{topic.translations[language].title}</Badge>
                  </button>
                ) : null;
              })}
            </div>
          ) : null}
        </article>
      ))}
    </Card>
  );
};
