import { useApp } from "../../app/AppProvider";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { antiPatterns } from "../../content/antiPatterns";
import { getKnowledgeTopicById } from "../../content/contentRegistry";
import type { RuleId } from "../../core/analyzer/types";
import type { TranslationKey } from "../../i18n/types";

const relatedRulesByPatternId: Partial<Record<string, RuleId>> = {
  "select-star": "select-star",
  "update-without-where": "update-without-where",
  "delete-without-where": "delete-without-where",
  "leading-wildcard-like": "leading-wildcard-like",
  "function-on-column": "function-in-where",
  "order-by-without-limit": "order-by-without-limit",
  "deep-offset-pagination": "offset-pagination",
  "too-many-or-conditions": "too-many-or-conditions",
  "missing-join-condition": "missing-join-condition",
  "cross-join-accident": "cross-join",
  "distinct-overuse": "distinct-overuse",
  "implicit-type-conversion": "implicit-conversion-risk",
  "not-in-null-risk": "not-in-null-risk",
  "n-plus-one": "possible-n-plus-one-pattern",
  "unbounded-result-set": "unbounded-select",
  "sorting-large-result": "order-by-without-limit",
  "order-by-random": "order-by-random",
};

export const AntiPatternsPage = () => {
  const { language, t } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title={t("antiPatterns.title")} subtitle={t("antiPatterns.subtitle")} />
      <section className="grid gap-4 xl:grid-cols-2">
        {antiPatterns.map((pattern) => {
          const text = pattern.translations[language];
          const topic = getKnowledgeTopicById(pattern.relatedKnowledgeTopic);
          const relatedRule = relatedRulesByPatternId[pattern.id];

          return (
            <Card key={pattern.id} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{text.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-atlas-muted">
                    {text.explanation}
                  </p>
                </div>
                <Badge tone={pattern.severity}>
                  {t(`severity.${pattern.severity}` as TranslationKey)}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-atlas-muted">
                    {t("antiPatterns.badExample")}
                  </p>
                  <CodeBlock code={pattern.badExample} className="max-h-48" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-atlas-muted">
                    {t("antiPatterns.goodExample")}
                  </p>
                  <CodeBlock code={pattern.goodExample} className="max-h-48" />
                </div>
              </div>
              <div className="grid gap-3 text-sm leading-6 text-atlas-muted md:grid-cols-2">
                <p>
                  <span className="font-semibold text-atlas-text">
                    {t("antiPatterns.why")}:
                  </span>{" "}
                  {text.whyItHurtsPerformance}
                </p>
                <p>
                  <span className="font-semibold text-atlas-text">
                    {t("antiPatterns.fix")}:
                  </span>{" "}
                  {text.suggestedFix}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedRule ? (
                  <Badge tone="cyan">
                    {t("antiPatterns.relatedRule")}:{" "}
                    {t(`rule.${relatedRule}.title` as TranslationKey)}
                  </Badge>
                ) : null}
                {topic ? (
                  <Badge tone="violet">{topic.translations[language].title}</Badge>
                ) : null}
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
};

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section>
    <h1 className="text-3xl font-semibold">{title}</h1>
    <p className="mt-2 text-atlas-muted">{subtitle}</p>
  </section>
);
