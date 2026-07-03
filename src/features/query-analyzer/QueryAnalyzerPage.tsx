import {
  ArrowRight,
  GitBranch,
  Info,
  Map as MapIcon,
  Play,
  Route,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { SqlEditor } from "../../components/editor/SqlEditor";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { CopyButton } from "../../components/ui/CopyButton";
import { SelectInput } from "../../components/ui/Field";
import { getKnowledgeTopicById } from "../../content/contentRegistry";
import { analyzeQuery } from "../../core/analyzer/analyzeQuery";
import type {
  AnalyzerFinding,
  AnalyzerSeverity,
  QueryAnalysisResult,
  SqlDialect,
} from "../../core/analyzer/types";
import type {
  BeforeAfterDiffLine,
  OptimizationBenefitId,
  OptimizationStep,
  QueryMapClause,
  QueryMapSection,
} from "../../core/analyzer/experience";
import { createMarkdownReport } from "../../core/report-export/markdownReport";
import type { TranslationKey } from "../../i18n/types";
import { highlightSql } from "../../lib/highlightSql";
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

const severityRank: Record<AnalyzerFinding["severity"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const benefitLabelKeys: Record<OptimizationBenefitId, TranslationKey> = {
  "lower-io": "analyzer.story.benefit.lowerIo",
  "safer-query": "analyzer.story.benefit.saferQuery",
  "better-index-usage": "analyzer.story.benefit.betterIndexUsage",
  "better-readability": "analyzer.story.benefit.betterReadability",
  "lower-sort-cost": "analyzer.story.benefit.lowerSortCost",
  "lower-full-scan-risk": "analyzer.story.benefit.lowerFullScanRisk",
};

const clauseLabelKeys: Record<QueryMapClause, TranslationKey> = {
  select: "analyzer.queryMap.clause.select",
  from: "analyzer.queryMap.clause.from",
  join: "analyzer.queryMap.clause.join",
  where: "analyzer.queryMap.clause.where",
  "group-by": "analyzer.queryMap.clause.groupBy",
  having: "analyzer.queryMap.clause.having",
  "order-by": "analyzer.queryMap.clause.orderBy",
  limit: "analyzer.queryMap.clause.limit",
  offset: "analyzer.queryMap.clause.offset",
};

const groupFindings = (analysis: QueryAnalysisResult | null) =>
  severityOrder.map((severity) => ({
    severity,
    findings:
      analysis?.findings.filter((finding) => finding.severity === severity) ?? [],
  }));

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

const usePrefersReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
};

export const QueryAnalyzerPage = () => {
  const {
    analyzerDialect,
    analyzerSql,
    language,
    latestAnalysis,
    runDemoAnalysis,
    setAnalyzerDialect,
    setAnalyzerSql,
    setLatestAnalysis,
    setPage,
    t,
  } = useApp();
  const groupedFindings = useMemo(
    () => groupFindings(latestAnalysis),
    [latestAnalysis],
  );
  const topRecommendations = useMemo(
    () => getTopRecommendations(latestAnalysis),
    [latestAnalysis],
  );

  const runAnalysis = (query = analyzerSql, dialect = analyzerDialect) => {
    if (!query.trim()) {
      setLatestAnalysis(null);
      return;
    }

    setLatestAnalysis(analyzeQuery(query, dialect));
  };

  const loadSample = (query: string) => {
    setAnalyzerSql(query);
    setLatestAnalysis(analyzeQuery(query, analyzerDialect));
  };

  const loadDemo = () => {
    runDemoAnalysis();
  };

  const breakdownData = latestAnalysis
    ? Object.entries(latestAnalysis.scoreBreakdown).map(([category, value]) => ({
        category: t(`category.${category}` as TranslationKey),
        value,
      }))
    : [];

  return (
    <div className="space-y-6 atlas-page-enter">
      <PageHeader title={t("analyzer.title")} subtitle={t("analyzer.subtitle")} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">{t("analyzer.inputLabel")}</h2>
            <div className="flex flex-wrap gap-2">
              <SelectInput
                value={analyzerDialect}
                onChange={(event) => {
                  const nextDialect = event.target.value as SqlDialect;
                  setAnalyzerDialect(nextDialect);
                  if (latestAnalysis && analyzerSql.trim()) {
                    setLatestAnalysis(analyzeQuery(analyzerSql, nextDialect));
                  }
                }}
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
                onClick={loadDemo}
                icon={<Sparkles size={16} />}
              >
                {t("actions.tryDemo")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setAnalyzerSql("");
                  setLatestAnalysis(null);
                }}
                icon={<Trash2 size={16} />}
              >
                {t("actions.clear")}
              </Button>
            </div>
          </div>
          <SqlEditor value={analyzerSql} onChange={setAnalyzerSql} />
          <Card className="p-4 atlas-animate-in">
            <h3 className="mb-3 text-sm font-semibold">{t("analyzer.samples")}</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {sqlSamples.map((sample, index) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => loadSample(sample.sql)}
                  className="atlas-stagger-item rounded-md border border-atlas-border bg-atlas-panelStrong p-3 text-left transition hover:border-atlas-cyan/60 hover:bg-atlas-cyan/10"
                  style={{ animationDelay: `${index * 35}ms` }}
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
            <AnalyzerEmptyState onTryDemo={loadDemo} />
          ) : (
            <>
              <ScoreCard analysis={latestAnalysis} breakdownData={breakdownData} />
              <TopRecommendations findings={topRecommendations} />

              <OptimizationStoryCard
                steps={latestAnalysis.optimizationStory.steps}
                language={language}
                onOpenKnowledge={() => setPage("knowledge-base")}
              />
              <BeforeAfterCard beforeAfter={latestAnalysis.beforeAfter} />
              <QueryMapCard
                sections={latestAnalysis.queryMap}
                findings={latestAnalysis.findings}
              />

              <Card className="atlas-animate-in">
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

              <Card className="atlas-animate-in">
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

              <SuggestedIndexesCard analysis={latestAnalysis} language={language} />
              <PassedChecksCard analysis={latestAnalysis} />
              <FormattedPreviewCard analysis={latestAnalysis} />
            </>
          )}
        </section>
      </div>
    </div>
  );
};

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const { t } = useApp();

  return (
    <section className="atlas-animate-in">
      <Badge tone="cyan">{t("analyzer.premiumBadge")}</Badge>
      <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-atlas-muted">{subtitle}</p>
    </section>
  );
};

const AnalyzerEmptyState = ({ onTryDemo }: { onTryDemo: () => void }) => {
  const { t } = useApp();
  const examples = [
    t("analyzer.emptyExample.selectStar"),
    t("analyzer.emptyExample.delete"),
    t("analyzer.emptyExample.lowerEmail"),
  ];

  return (
    <Card className="atlas-animate-in overflow-hidden">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge tone="violet">{t("analyzer.emptyBadge")}</Badge>
          <h3 className="mt-3 text-xl font-semibold">{t("analyzer.emptyTitle")}</h3>
          <p className="mt-2 text-sm leading-6 text-atlas-muted">
            {t("analyzer.emptyBody")}
          </p>
          <div className="mt-4 grid gap-2">
            {examples.map((example) => (
              <div
                key={example}
                className="rounded-md border border-atlas-border bg-atlas-panelStrong px-3 py-2 text-sm text-atlas-muted"
              >
                {example}
              </div>
            ))}
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={onTryDemo}
          icon={<Sparkles size={16} />}
          className="self-start"
        >
          {t("actions.tryDemo")}
        </Button>
      </div>
    </Card>
  );
};

const ScoreCard = ({
  analysis,
  breakdownData,
}: {
  analysis: QueryAnalysisResult;
  breakdownData: Array<{ category: string; value: number }>;
}) => {
  const { t } = useApp();

  return (
    <Card className="atlas-animate-in grid gap-4 md:grid-cols-[140px_1fr]">
      <div className="flex h-32 w-32 items-center justify-center rounded-full border border-atlas-cyan/50 bg-atlas-cyan/10 shadow-[0_0_50px_rgba(64,200,232,0.12)]">
        <div className="text-center">
          <p className="text-4xl font-semibold">
            <AnimatedScore value={analysis.score} />
          </p>
          <p className="text-xs text-atlas-muted">{t("analyzer.score")}</p>
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold">
          {t("analyzer.scoreBreakdown")}
        </h3>
        <div className="space-y-3">
          {breakdownData.map((item, index) => (
            <div
              key={item.category}
              className="atlas-stagger-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="text-atlas-muted">{item.category}</span>
                <span className="font-medium text-atlas-text">
                  {item.value}/100
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-atlas-border">
                <div
                  className="h-full rounded-full bg-atlas-cyan transition-[width] duration-700"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const AnimatedScore = ({ value }: { value: number }) => {
  const reducedMotion = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const start = performance.now();
    const duration = 650;

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayValue(Math.round(value * progress));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameId);
  }, [reducedMotion, value]);

  return <>{displayValue}</>;
};

const TopRecommendations = ({ findings }: { findings: AnalyzerFinding[] }) => {
  const { t } = useApp();

  return (
    <Card className="space-y-3 atlas-animate-in">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          {t("analyzer.topRecommendations")}
        </h3>
        <Badge tone="cyan">{findings.length}</Badge>
      </div>
      {findings.length === 0 ? (
        <p className="text-sm text-atlas-muted">
          {t("analyzer.noRecommendations")}
        </p>
      ) : (
        <div className="space-y-2">
          {findings.map((finding, index) => (
            <div
              key={finding.id}
              className="atlas-stagger-item rounded-md border border-atlas-border bg-atlas-panelStrong p-3 transition hover:border-atlas-cyan/50"
              style={{ animationDelay: `${index * 55}ms` }}
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
  );
};

const OptimizationStoryCard = ({
  language,
  onOpenKnowledge,
  steps,
}: {
  language: "en" | "pl";
  onOpenKnowledge: () => void;
  steps: OptimizationStep[];
}) => {
  const { t } = useApp();

  return (
    <Card className="atlas-animate-in overflow-hidden">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Route size={18} className="text-atlas-cyan" />
            <h3 className="text-sm font-semibold">{t("analyzer.story.title")}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-atlas-muted">
            {t("analyzer.story.subtitle")}
          </p>
        </div>
        <Badge tone="cyan">{steps.length}</Badge>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-atlas-muted">{t("analyzer.story.empty")}</p>
      ) : (
        <div className="relative space-y-4 before:absolute before:bottom-4 before:left-5 before:top-2 before:w-px before:bg-atlas-border">
          {steps.map((step, index) => (
            <article
              key={step.issueId}
              className="atlas-stagger-item relative grid gap-3 pl-12"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-atlas-cyan/50 bg-atlas-panelStrong text-sm font-semibold text-atlas-cyan shadow-[0_0_26px_rgba(64,200,232,0.18)]">
                {step.stepNumber}
              </div>
              <div className="rounded-md border border-atlas-border bg-atlas-panelStrong p-4 transition hover:border-atlas-cyan/50">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={step.severity}>
                    {t(`severity.${step.severity}` as TranslationKey)}
                  </Badge>
                  <Badge tone="neutral">
                    {t(`category.${step.category}` as TranslationKey)}
                  </Badge>
                  <span className="text-xs text-atlas-muted">
                    {t("analyzer.scoreImpact")}: -{step.scoreImpact}
                  </span>
                </div>
                <h4 className="mt-3 text-base font-semibold">
                  {t("analyzer.story.step", { step: step.stepNumber })} -{" "}
                  {t(step.titleKey)}
                </h4>
                {step.detectedFragment ? (
                  <p className="mt-2 text-sm text-atlas-muted">
                    <span className="font-medium text-atlas-text">
                      {t("analyzer.story.detected")}:
                    </span>{" "}
                    <code className="rounded bg-atlas-bg px-1.5 py-0.5 text-atlas-cyan">
                      {step.detectedFragment}
                    </code>
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-atlas-muted">
                  <span className="font-medium text-atlas-text">
                    {t("analyzer.story.why")}:
                  </span>{" "}
                  {t(step.whyKey)}
                </p>
                <p className="mt-2 text-sm leading-6 text-atlas-muted">
                  <span className="font-medium text-atlas-text">
                    {t("analyzer.story.action")}:
                  </span>{" "}
                  {t(step.actionKey)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {step.expectedBenefits.map((benefit) => (
                    <Badge key={benefit} tone="success">
                      {t(benefitLabelKeys[benefit])}
                    </Badge>
                  ))}
                </div>
                {step.suggestedSqlSnippet ? (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase text-atlas-muted">
                        {t("analyzer.suggestedSql")}
                      </p>
                      <CopyButton value={step.suggestedSqlSnippet} compact />
                    </div>
                    <CodeBlock code={step.suggestedSqlSnippet} className="max-h-44" />
                  </div>
                ) : null}
                {step.relatedTopicIds.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {step.relatedTopicIds.slice(0, 3).map((topicId) => {
                      const topic = getKnowledgeTopicById(topicId);
                      return topic ? (
                        <button key={topicId} type="button" onClick={onOpenKnowledge}>
                          <Badge tone="violet">
                            {topic.translations[language].title}
                          </Badge>
                        </button>
                      ) : null;
                    })}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
};

const BeforeAfterCard = ({
  beforeAfter,
}: {
  beforeAfter: QueryAnalysisResult["beforeAfter"];
}) => {
  const { t } = useApp();
  const hasSuggestion = beforeAfter.status === "available" && beforeAfter.suggestedSql;

  return (
    <Card className="atlas-animate-in">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-atlas-cyan" />
            <h3 className="text-sm font-semibold">{t("analyzer.beforeAfter.title")}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-atlas-muted">
            {t("analyzer.beforeAfter.subtitle")}
          </p>
        </div>
        {hasSuggestion ? (
          <CopyButton value={beforeAfter.suggestedSql ?? ""} compact />
        ) : null}
      </div>

      {beforeAfter.warningKey ? (
        <div className="mb-4 rounded-md border border-atlas-red/50 bg-atlas-red/10 p-3 text-sm leading-6 text-red-100">
          {t(beforeAfter.warningKey)}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <DiffBlock
          title={t("analyzer.beforeAfter.before")}
          lines={beforeAfter.originalLines}
        />
        <DiffBlock
          title={t("analyzer.beforeAfter.after")}
          emptyText={
            beforeAfter.status === "unsafe-blocked"
              ? t("analyzer.beforeAfter.noUnsafeRewrite")
              : t("analyzer.beforeAfter.noRewrite")
          }
          lines={beforeAfter.suggestedLines}
        />
      </div>

      {beforeAfter.notes.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {beforeAfter.notes.map((noteKey) => (
            <p
              key={noteKey}
              className="rounded-md border border-atlas-border bg-atlas-panelStrong px-3 py-2 text-xs leading-5 text-atlas-muted"
            >
              {t(noteKey)}
            </p>
          ))}
        </div>
      ) : null}

      {beforeAfter.extraSqlSnippet ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-atlas-muted">
              {t("analyzer.beforeAfter.relatedSnippet")}
            </p>
            <CopyButton value={beforeAfter.extraSqlSnippet} compact />
          </div>
          <CodeBlock code={beforeAfter.extraSqlSnippet} className="max-h-40" />
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-atlas-muted">
        {t("analyzer.beforeAfter.disclaimer")}
      </p>
    </Card>
  );
};

const DiffBlock = ({
  emptyText,
  lines,
  title,
}: {
  emptyText?: string;
  lines: BeforeAfterDiffLine[];
  title: string;
}) => (
  <div className="min-w-0 rounded-md border border-atlas-border bg-[#070a10]">
    <div className="border-b border-atlas-border px-3 py-2 text-xs font-semibold uppercase text-atlas-muted">
      {title}
    </div>
    {lines.length === 0 ? (
      <div className="p-4 text-sm leading-6 text-atlas-muted">{emptyText}</div>
    ) : (
      <pre className="max-h-72 overflow-auto p-0 text-sm leading-6">
        {lines.map((line) => (
          <div
            key={`${line.lineNumber}-${line.value}`}
            className={
              line.changed
                ? "grid grid-cols-[3rem_1fr] bg-atlas-cyan/10 text-atlas-text"
                : "grid grid-cols-[3rem_1fr] text-atlas-muted"
            }
          >
            <span className="select-none border-r border-atlas-border px-3 text-right text-xs text-atlas-muted">
              {line.lineNumber}
            </span>
            <code
              className="code-highlight min-w-0 px-3"
              dangerouslySetInnerHTML={{
                __html: highlightSql(line.value || " "),
              }}
            />
          </div>
        ))}
      </pre>
    )}
  </div>
);

const QueryMapCard = ({
  findings,
  sections,
}: {
  findings: AnalyzerFinding[];
  sections: QueryMapSection[];
}) => {
  const { t } = useApp();
  const findingMap = new Map(findings.map((finding) => [finding.id, finding]));

  return (
    <Card className="atlas-animate-in">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapIcon size={18} className="text-atlas-cyan" />
            <h3 className="text-sm font-semibold">{t("analyzer.queryMap.title")}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-atlas-muted">
            {t("analyzer.queryMap.subtitle")}
          </p>
        </div>
        <Badge tone="cyan">{sections.length}</Badge>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-atlas-muted">{t("analyzer.queryMap.empty")}</p>
      ) : (
        <div className="grid gap-3">
          {sections.map((section, index) => (
            <div
              key={`${section.clause}-${section.fragment}`}
              className="atlas-stagger-item grid gap-3 rounded-md border border-atlas-border bg-atlas-panelStrong p-3 md:grid-cols-[130px_1fr]"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="flex items-start gap-3 md:block">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-atlas-cyan/40 bg-atlas-cyan/15 text-sm font-semibold text-atlas-cyan">
                  {index + 1}
                </div>
                <div className="md:mt-3">
                  <p className="text-sm font-semibold">
                    {t(clauseLabelKeys[section.clause])}
                  </p>
                  <p className="mt-1 text-xs text-atlas-muted">
                    {section.relatedIssueIds.length > 0
                      ? t("analyzer.queryMap.hasIssues")
                      : t("analyzer.queryMap.noIssues")}
                  </p>
                </div>
              </div>
              <div className="min-w-0">
                <CodeBlock code={section.fragment} className="max-h-36" />
                <p className="mt-2 text-sm leading-6 text-atlas-muted">
                  {t(section.noteKey)}
                </p>
                {section.relatedIssueIds.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {section.relatedIssueIds.map((issueId) => {
                      const finding = findingMap.get(issueId);
                      return finding ? (
                        <Badge key={issueId} tone={finding.severity}>
                          {t(finding.titleKey)}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

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
    <Card className="space-y-3 atlas-animate-in">
      <div className="flex items-center gap-2">
        <Badge tone={severity}>{title}</Badge>
        <span className="text-sm text-atlas-muted">{findings.length}</span>
      </div>
      {findings.map((finding, index) => (
        <article
          key={finding.id}
          className="atlas-stagger-item rounded-md border border-atlas-border bg-atlas-panelStrong p-4"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h4 className="font-semibold">{t(finding.titleKey)}</h4>
              <p className="mt-1 text-sm leading-6 text-atlas-muted">
                {t(finding.explanationKey)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">
                {t(`category.${finding.category}` as TranslationKey)}
              </Badge>
              <Badge tone="neutral">
                {t("analyzer.scoreImpact")}: -{finding.scoreImpact}
              </Badge>
            </div>
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

const SuggestedIndexesCard = ({
  analysis,
  language,
}: {
  analysis: QueryAnalysisResult;
  language: "en" | "pl";
}) => {
  const { t } = useApp();

  return (
    <Card className="atlas-animate-in">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("analyzer.suggestedIndexes")}</h3>
        <Badge tone="cyan">{analysis.indexSuggestions.length}</Badge>
      </div>
      {analysis.indexSuggestions.length === 0 ? (
        <p className="text-sm text-atlas-muted">
          {t("analyzer.noIndexSuggestions")}
        </p>
      ) : (
        <div className="space-y-3">
          {analysis.indexSuggestions.slice(0, 4).map((suggestion, index) => (
            <div
              key={suggestion.id}
              className="atlas-stagger-item rounded-md border border-atlas-border bg-atlas-panelStrong p-3"
              style={{ animationDelay: `${index * 50}ms` }}
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
  );
};

const PassedChecksCard = ({ analysis }: { analysis: QueryAnalysisResult }) => {
  const { t } = useApp();

  return (
    <Card className="atlas-animate-in">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("analyzer.passedChecks")}</h3>
        <Badge tone="success">{analysis.passedChecks.length}</Badge>
      </div>
      <div className="flex max-h-36 flex-wrap gap-2 overflow-auto">
        {analysis.passedChecks.map((check) => (
          <Badge key={check.id} tone="success">
            {t(check.titleKey)}
          </Badge>
        ))}
      </div>
    </Card>
  );
};

const FormattedPreviewCard = ({ analysis }: { analysis: QueryAnalysisResult }) => {
  const { t } = useApp();

  return (
    <Card className="atlas-animate-in">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("analyzer.formattedPreview")}</h3>
        <CopyButton value={analysis.formattedSql} compact />
      </div>
      <CodeBlock code={analysis.formattedSql} />
    </Card>
  );
};
