import { useApp } from "../../app/AppProvider";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { dialectComparisonTopics } from "../../core/dialects/dialectData";

export const DialectComparePage = () => {
  const { language, t } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title={t("dialects.title")} subtitle={t("dialects.subtitle")} />
      <section className="space-y-4">
        {dialectComparisonTopics.map((topic) => {
          const text = topic.translations[language];

          return (
            <Card key={topic.id} className="space-y-4">
              <div>
                <Badge tone="cyan">{t("dialects.concept")}</Badge>
                <h2 className="mt-3 text-2xl font-semibold">{text.concept}</h2>
                <p className="mt-2 text-sm leading-6 text-atlas-muted">
                  {text.explanation}
                </p>
              </div>
              <div className="grid gap-3 xl:grid-cols-5">
                {topic.examples.map((example) => (
                  <div
                    key={example.dialect}
                    className="rounded-md border border-atlas-border bg-atlas-panelStrong p-3"
                  >
                    <Badge tone="neutral">{example.dialect}</Badge>
                    <CodeBlock code={example.sql} className="mt-3 max-h-44 p-3 text-xs" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-atlas-muted">
                <span className="font-semibold text-atlas-text">
                  {t("dialects.notes")}:
                </span>{" "}
                {text.notes}
              </p>
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
