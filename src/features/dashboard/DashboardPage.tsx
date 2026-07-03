import { ArrowRight, BookOpen, GitCompare, SearchCode } from "lucide-react";
import { useApp } from "../../app/AppProvider";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { dashboardQuickLinks } from "../../components/layout/navigation";
import { analyzerRules } from "../../core/analyzer/rules";
import { contentStats } from "../../content/contentRegistry";
import { dialectComparisonTopics } from "../../core/dialects/dialectData";
import type { TranslationKey } from "../../i18n/types";

const quickLinkBodyKeys: Partial<Record<string, TranslationKey>> = {
  "query-analyzer": "dashboard.card.queryAnalyzerBody",
  "index-advisor": "dashboard.card.indexAdvisorBody",
  "knowledge-base": "dashboard.card.knowledgeBaseBody",
  "anti-patterns": "dashboard.card.antiPatternsBody",
  "dialect-compare": "dashboard.card.dialectsBody",
  "explain-visualizer": "dashboard.card.explainBody",
};

const quickLinkTitleKeys: Partial<Record<string, TranslationKey>> = {
  "query-analyzer": "dashboard.card.queryAnalyzer",
  "index-advisor": "dashboard.card.indexAdvisor",
  "knowledge-base": "dashboard.card.knowledgeBase",
  "anti-patterns": "dashboard.card.antiPatterns",
  "dialect-compare": "dashboard.card.dialects",
  "explain-visualizer": "dashboard.card.explain",
};

export const DashboardPage = () => {
  const { setPage, t } = useApp();
  const stats = [
    { label: t("dashboard.rules"), value: analyzerRules.length },
    { label: t("dashboard.topics"), value: contentStats.knowledgeTopics },
    { label: t("dashboard.antipatterns"), value: contentStats.antiPatterns },
    { label: t("dashboard.dialectComparisons"), value: dialectComparisonTopics.length },
  ];
  const howItWorksSteps = [
    {
      title: t("dashboard.howItWorks.paste.title"),
      body: t("dashboard.howItWorks.paste.body"),
    },
    {
      title: t("dashboard.howItWorks.review.title"),
      body: t("dashboard.howItWorks.review.body"),
    },
    {
      title: t("dashboard.howItWorks.learn.title"),
      body: t("dashboard.howItWorks.learn.body"),
    },
    {
      title: t("dashboard.howItWorks.optimize.title"),
      body: t("dashboard.howItWorks.optimize.body"),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-atlas-border bg-atlas-panelStrong">
        <div className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <Badge tone="cyan">{t("app.tagline")}</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-atlas-text md:text-5xl">
              {t("dashboard.title")}
            </h1>
            <p className="mt-2 text-lg text-atlas-muted">{t("dashboard.subtitle")}</p>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-atlas-muted">
              {t("dashboard.promise")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="success">{t("privacy.noAi")}</Badge>
              <Badge tone="cyan">{t("privacy.localAnalysis")}</Badge>
              <Badge tone="neutral">{t("privacy.noTracking")}</Badge>
              <Badge tone="violet">{t("privacy.languages")}</Badge>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={() => setPage("query-analyzer")}
                icon={<SearchCode size={16} />}
              >
                {t("dashboard.cta.analyze")}
              </Button>
              <Button
                type="button"
                onClick={() => setPage("knowledge-base")}
                icon={<BookOpen size={16} />}
              >
                {t("dashboard.cta.knowledge")}
              </Button>
              <Button
                type="button"
                onClick={() => setPage("dialect-compare")}
                icon={<GitCompare size={16} />}
              >
                {t("dashboard.cta.dialects")}
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-atlas-border bg-[#070a10] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-atlas-muted">
                SQL Atlas
              </span>
              <Badge tone="success">100</Badge>
            </div>
            <pre className="overflow-hidden text-sm leading-7 text-atlas-muted">
              <code>{`SELECT id, email, created_at
FROM customers
WHERE email = :email
ORDER BY created_at DESC
LIMIT 25;`}</code>
            </pre>
            <div className="mt-4 grid gap-2">
              <div className="h-2 rounded-full bg-atlas-cyan" />
              <div className="h-2 w-4/5 rounded-full bg-atlas-green" />
              <div className="h-2 w-3/5 rounded-full bg-atlas-amber" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-3xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-atlas-muted">{stat.label}</p>
          </Card>
        ))}
      </section>

      <section className="rounded-lg border border-atlas-border bg-atlas-panel p-5">
        <h2 className="text-xl font-semibold">{t("dashboard.howItWorks")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {howItWorksSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-md border border-atlas-border bg-atlas-panelStrong p-4"
            >
              <Badge tone="cyan">{index + 1}</Badge>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-atlas-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardQuickLinks.map((item) => {
          const Icon = item.icon;
          const titleKey = quickLinkTitleKeys[item.page] ?? item.labelKey;
          const bodyKey = quickLinkBodyKeys[item.page] ?? "dashboard.subtitle";

          return (
            <Card key={item.page} className="flex min-h-52 flex-col justify-between">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-atlas-cyan/40 bg-atlas-cyan/15">
                  <Icon size={19} />
                </div>
                <h2 className="text-xl font-semibold">{t(titleKey)}</h2>
                <p className="mt-2 text-sm leading-6 text-atlas-muted">
                  {t(bodyKey)}
                </p>
              </div>
              <Button
                className="mt-5 self-start"
                type="button"
                onClick={() => setPage(item.page)}
                icon={<ArrowRight size={16} />}
              >
                {t("actions.open")}
              </Button>
            </Card>
          );
        })}
      </section>
    </div>
  );
};
