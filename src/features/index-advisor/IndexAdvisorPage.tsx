import { Gauge } from "lucide-react";
import { useApp } from "../../app/AppProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { CopyButton } from "../../components/ui/CopyButton";

export const IndexAdvisorPage = () => {
  const { language, latestAnalysis, setPage, t } = useApp();
  const suggestions = latestAnalysis?.indexSuggestions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("indexAdvisor.title")} subtitle={t("indexAdvisor.subtitle")} />
      <Card>
        <div className="flex items-start gap-3">
          <Gauge className="mt-1 text-atlas-cyan" size={20} />
          <p className="text-sm leading-6 text-atlas-muted">
            {t("indexAdvisor.warning")}
          </p>
        </div>
      </Card>
      {suggestions.length === 0 ? (
        <Card>
          <p className="text-atlas-muted">{t("indexAdvisor.empty")}</p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => setPage("query-analyzer")}
          >
            {t("nav.queryAnalyzer")}
          </Button>
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="cyan">{suggestion.source}</Badge>
                  <Badge tone="neutral">
                    {t(`confidence.${suggestion.confidence}` as never)}
                  </Badge>
                </div>
                <CopyButton value={suggestion.sqlSnippet} compact />
              </div>
              <CodeBlock code={suggestion.sqlSnippet} />
              <div className="space-y-3 text-sm text-atlas-muted">
                <p>
                  <span className="font-semibold text-atlas-text">
                    {t("indexAdvisor.reason")}:
                  </span>{" "}
                  {suggestion.reason[language]}
                </p>
                <p>
                  <span className="font-semibold text-atlas-text">
                    {t("indexAdvisor.fragment")}:
                  </span>{" "}
                  <code>{suggestion.relatedQueryFragment}</code>
                </p>
                <p>{suggestion.educationalWarning[language]}</p>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
};

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section>
    <h1 className="text-3xl font-semibold">{title}</h1>
    <p className="mt-2 text-atlas-muted">{subtitle}</p>
  </section>
);
