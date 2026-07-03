import { useMemo } from "react";
import { useApp } from "../../app/AppProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { CopyButton } from "../../components/ui/CopyButton";
import { createMarkdownReport } from "../../core/report-export/markdownReport";

export const ReportExportPage = () => {
  const { language, latestAnalysis, setPage, t } = useApp();
  const markdown = useMemo(
    () =>
      latestAnalysis
        ? createMarkdownReport({ analysis: latestAnalysis, language, t })
        : "",
    [language, latestAnalysis, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("report.title")} subtitle={t("report.subtitle")} />
      {!latestAnalysis ? (
        <Card>
          <p className="text-atlas-muted">{t("report.empty")}</p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => setPage("query-analyzer")}
          >
            {t("nav.queryAnalyzer")}
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("report.preview")}</h2>
            <CopyButton value={markdown} />
          </div>
          <CodeBlock code={markdown} language="markdown" />
        </Card>
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
